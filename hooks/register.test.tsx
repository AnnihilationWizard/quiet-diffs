import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const EDIT = {
  filePath: '/repo/src/app.ts',
  oldString: 'a',
  newString: 'b',
  originalFile: 'a\n',
  structuredPatch: [
    { oldStart: 1, oldLines: 2, newStart: 1, newLines: 3, lines: ['-a', '+b', '+c', ' d'] },
  ],
  userModified: false,
  replaceAll: false,
}

const WRITE_NEW = {
  type: 'create',
  filePath: '/repo/new.md',
  content: 'one\ntwo\nthree',
  structuredPatch: [],
  originalFile: null,
}

const BASH_EDITS = {
  stdout: 'done',
  stderr: '',
  interrupted: false,
  bashEditDiff: {
    files: [
      {
        filePath: '/repo/notes.txt',
        hunks: [{ oldStart: 1, oldLines: 2, newStart: 1, newLines: 3, lines: [' a', '-b', '+b2', '+c'] }],
      },
      { filePath: '/repo/new.txt', created: true, hunks: [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 1, lines: ['+x'] }] },
      { filePath: '/repo/old.txt', deleted: true, hunks: [{ oldStart: 1, oldLines: 2, newStart: 0, newLines: 0, lines: ['-y', '-z'] }] },
    ],
    moreFiles: 2,
  },
}

const SURFACES = ['terminal', 'desktop'] as const

const TOGGLE = {
  command: 'quiet-diffs',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 120 },
} as const

// Stands for the engine's own result renderer beneath the plugin: it says
// whether it was handed a Bash edit diff to draw.
const engineDraws = (on: On) => {
  on('ui.render', { component: 'ToolResult' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    const output = e.props.output as { bashEditDiff?: unknown } | undefined
    return <Text>{output?.bashEditDiff === undefined ? 'ENGINE' : 'ENGINE+DIFF'}</Text>
  })
}

const mountResult = (
  $: Engine,
  surface: (typeof SURFACES)[number],
  tool: string,
  output: unknown,
  isErrored = false,
) =>
  $.ui.mount({
    plugin: 'quiet-diffs',
    surface,
    component: 'ToolResult',
    props: { tool_use_id: 'tu1', tool, output, isErrored },
  })

const shownText = async (ui: Awaited<ReturnType<typeof mountResult>>) =>
  (await ui.find({ type: 'Text' }))?.text

const shownTexts = async (ui: Awaited<ReturnType<typeof mountResult>>) =>
  (await ui.findAll({ type: 'Text' })).map(found => found.text)

test('Edit diff is drawn as a one-line summary', async ($, on) => {
  engineDraws(on)
  for (const surface of SURFACES) {
    const ui = await mountResult($, surface, 'Edit', EDIT)
    expect(await shownText(ui)).toBe('Edited /repo/src/app.ts (+2 −1)')
    await ui.unmount()
  }
})

test('a new file from Write shows its line count', async ($, on) => {
  engineDraws(on)
  for (const surface of SURFACES) {
    const ui = await mountResult($, surface, 'Write', WRITE_NEW)
    expect(await shownText(ui)).toBe('Created /repo/new.md (3 lines)')
    await ui.unmount()

    const trailing = await mountResult($, surface, 'Write', { ...WRITE_NEW, content: 'one\ntwo\nthree\n' })
    expect(await shownText(trailing)).toBe('Created /repo/new.md (3 lines)')
    await trailing.unmount()

    const single = await mountResult($, surface, 'Write', { ...WRITE_NEW, content: 'only\n' })
    expect(await shownText(single)).toBe('Created /repo/new.md (1 line)')
    await single.unmount()
  }
})

test('other tools and errored edits keep the engine drawing', async ($, on) => {
  engineDraws(on)
  for (const surface of SURFACES) {
    const bash = await mountResult($, surface, 'Bash', { stdout: 'ok', stderr: '', interrupted: false })
    expect(await shownText(bash)).toBe('ENGINE')
    await bash.unmount()

    const failed = await mountResult($, surface, 'Edit', EDIT, true)
    expect(await shownText(failed)).toBe('ENGINE')
    await failed.unmount()
  }
})

test('/quiet-diffs toggles the full diff back on and off', async ($, on) => {
  engineDraws(on)
  const shown = await $.command.run(TOGGLE)
  expect(shown).toEqual(expect.objectContaining({ text: 'Showing full diffs' }))

  const full = await mountResult($, 'terminal', 'Edit', EDIT)
  expect(await shownText(full)).toBe('ENGINE')
  await full.unmount()

  const hidden = await $.command.run(TOGGLE)
  expect(hidden).toEqual(expect.objectContaining({ text: 'Showing one-line summaries' }))

  const quiet = await mountResult($, 'terminal', 'Edit', EDIT)
  expect(await shownText(quiet)).toBe('Edited /repo/src/app.ts (+2 −1)')
  await quiet.unmount()
})

test('Bash file edits keep the command output and drop the diff', async ($, on) => {
  engineDraws(on)
  for (const surface of SURFACES) {
    const ui = await mountResult($, surface, 'Bash', BASH_EDITS)
    expect(await shownTexts(ui)).toEqual([
      'ENGINE',
      'Edited /repo/notes.txt (+2 −1)',
      'Created /repo/new.txt (+1 −0)',
      'Deleted /repo/old.txt (+0 −2)',
      'and 2 more files',
    ])
    await ui.unmount()
  }
})

test('Bash results without file edits, and /quiet-diffs, keep the full drawing', async ($, on) => {
  engineDraws(on)
  const skipped = await mountResult($, 'terminal', 'Bash', {
    ...BASH_EDITS,
    bashEditDiff: { files: [], moreFiles: 0, skipped: true },
  })
  expect(await shownTexts(skipped)).toEqual(['ENGINE+DIFF'])
  await skipped.unmount()

  await $.command.run(TOGGLE)
  const full = await mountResult($, 'terminal', 'Bash', BASH_EDITS)
  expect(await shownTexts(full)).toEqual(['ENGINE+DIFF'])
  await full.unmount()
  await $.command.run(TOGGLE)
})
