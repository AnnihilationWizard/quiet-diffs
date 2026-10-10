import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { ShowDiffs } from '../types'

const showDiffs = atom({ plugin: 'quiet-diffs', key: 'showDiffs' } as const, false as ShowDiffs)

type Hunk = { lines: string[] }

const countLines = (hunks: readonly Hunk[]) => {
  let added = 0
  let removed = 0
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith('+')) added += 1
      else if (line.startsWith('-')) removed += 1
    }
  }

  return { added, removed }
}

const summarize = (tool: string, output: unknown): string | undefined => {
  if (typeof output !== 'object' || output === null) return undefined
  const o = output as Record<string, unknown>
  if (o.staged === true) return undefined

  if (tool === 'Edit' && typeof o.filePath === 'string' && Array.isArray(o.structuredPatch)) {
    const { added, removed } = countLines(o.structuredPatch as Hunk[])
    return `Edited ${o.filePath} (+${added} −${removed})`
  }
  if (tool === 'Write' && typeof o.filePath === 'string') {
    if (o.type === 'create') {
      const text = typeof o.content === 'string' ? o.content.replace(/\n$/, '') : ''
      const lines = text === '' ? 0 : text.split('\n').length
      return `Created ${o.filePath} (${lines} ${lines === 1 ? 'line' : 'lines'})`
    }
    const hunks = Array.isArray(o.structuredPatch) ? (o.structuredPatch as Hunk[]) : []
    const { added, removed } = countLines(hunks)
    return `Overwrote ${o.filePath} (+${added} −${removed})`
  }
  if (tool === 'NotebookEdit' && typeof o.notebook_path === 'string' && !o.error) {
    return `Edited ${o.notebook_path} (cell ${String(o.cell_id ?? '?')}, ${String(o.edit_mode)})`
  }

  return undefined
}

type BashFile = { filePath: string; hunks: Hunk[]; created?: true; deleted?: true }

// Splits a Bash result into the output without its file-edit diff and one
// line per changed file. Undefined when the command changed no files.
const splitBashEdits = (output: unknown) => {
  if (typeof output !== 'object' || output === null) return undefined
  const { bashEditDiff, ...rest } = output as Record<string, unknown>
  if (typeof bashEditDiff !== 'object' || bashEditDiff === null) return undefined
  const diff = bashEditDiff as { files?: unknown; moreFiles?: unknown }
  if (!Array.isArray(diff.files) || diff.files.length === 0) return undefined

  const lines = (diff.files as BashFile[]).map(file => {
    const { added, removed } = countLines(file.hunks ?? [])
    const verb = file.created ? 'Created' : file.deleted ? 'Deleted' : 'Edited'
    return `${verb} ${file.filePath} (+${added} −${removed})`
  })
  const more = typeof diff.moreFiles === 'number' ? diff.moreFiles : 0
  if (more > 0) lines.push(`and ${more} more ${more === 1 ? 'file' : 'files'}`)

  return { output: rest, lines }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'quiet-diffs',
      description: 'Toggle between full diffs and one-line summaries for file edits',
    })

    return next(e)
  })

  on('command.run', { command: 'quiet-diffs' }, async $ => {
    const shown = await update($, showDiffs, v => !v)

    return { text: shown ? 'Showing full diffs' : 'Showing one-line summaries' }
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.props.isErrored || (await read($, showDiffs))) return next(e)
    const { Box, Text } = $.ui.resolve(e)

    if (e.props.tool === 'Bash') {
      const split = splitBashEdits(e.props.output)
      if (split === undefined) return next(e)
      const drawn = await next({ ...e, props: { ...e.props, output: split.output } })

      return (
        <Box flexDirection="column">
          {drawn}
          {split.lines.map(line => (
            <Text dimColor>{line}</Text>
          ))}
        </Box>
      )
    }

    const line = summarize(e.props.tool, e.props.output)
    if (line === undefined) return next(e)

    return <Text dimColor>{line}</Text>
  })
}
