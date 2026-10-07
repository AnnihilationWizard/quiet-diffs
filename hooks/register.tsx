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
    const line = summarize(e.props.tool, e.props.output)
    if (line === undefined) return next(e)

    const { Text } = $.ui.resolve(e)

    return <Text dimColor>{line}</Text>
  })
}
