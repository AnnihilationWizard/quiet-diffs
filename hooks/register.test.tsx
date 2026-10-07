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

const SURFACES = ['terminal', 'desktop'] as const

const TOGGLE = {
  command: 'quiet-diffs',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 120 },
} as const

// Stands for the engine's own result renderer beneath the plugin.
const engineDraws = (on: On) => {
  on('ui.render', { component: 'ToolResult' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>ENGINE</Text>
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

test('Edit diff is drawn as a one-line summary', async ($, on) => {
  engineDraws(on)
  for (const surface of SURFACES) {
    const ui = await mountResult($, surface, 'Edit', EDIT)
    expect(await shownText(ui)).toBe('已修改 /repo/src/app.ts（+2 −1）')
    await ui.unmount()
  }
})

test('a new file from Write shows its line count', async ($, on) => {
  engineDraws(on)
  for (const surface of SURFACES) {
    const ui = await mountResult($, surface, 'Write', WRITE_NEW)
    expect(await shownText(ui)).toBe('已建立 /repo/new.md（3 行）')
    await ui.unmount()

    const trailing = await mountResult($, surface, 'Write', { ...WRITE_NEW, content: 'one\ntwo\nthree\n' })
    expect(await shownText(trailing)).toBe('已建立 /repo/new.md（3 行）')
    await trailing.unmount()
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
  expect(shown).toEqual(expect.objectContaining({ text: '已顯示完整 diff' }))

  const full = await mountResult($, 'terminal', 'Edit', EDIT)
  expect(await shownText(full)).toBe('ENGINE')
  await full.unmount()

  const hidden = await $.command.run(TOGGLE)
  expect(hidden).toEqual(expect.objectContaining({ text: '已改為一行摘要' }))

  const quiet = await mountResult($, 'terminal', 'Edit', EDIT)
  expect(await shownText(quiet)).toBe('已修改 /repo/src/app.ts（+2 −1）')
  await quiet.unmount()
})
