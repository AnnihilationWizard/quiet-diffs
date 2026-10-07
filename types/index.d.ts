export type ShowDiffs = boolean

declare module 'claude-code' {
  interface PluginState {
    'quiet-diffs': { showDiffs: ShowDiffs }
  }
}
