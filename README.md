# quiet-diffs

A Claude Code mod that replaces the full diff under file edits with a one-line summary, so the transcript shows the steps without walls of red and green.

| Tool | Shown instead of the diff |
| --- | --- |
| `Edit` | `已修改 src/app.ts（+12 −3）` |
| `Write` (new file) | `已建立 docs/notes.md（40 行）` |
| `Write` (overwrite) | `已覆寫 config.json（+5 −2）` |
| `NotebookEdit` | `已修改 analysis.ipynb（cell abc123，replace）` |

Other tools, failed edits and edits held for review keep Claude Code's own rendering. The stored tool result is untouched; only the drawing changes.

## Install

In a Claude Code terminal session:

```
/plugin install quiet-diffs --marketplace <owner>/quiet-diffs
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

## Use

- `/quiet-diffs` toggles the full diff back on for this session; run it again to return to summaries.
- The mod cannot tell the `Ctrl+O` transcript apart, so it summarizes there too. Use `/quiet-diffs` when you want the full diff.

Pair it with these settings in `~/.claude/settings.json` to quiet the rest:

```json
{
  "viewMode": "default",
  "bashEditDiffEnabled": false
}
```

`bashEditDiffEnabled: false` stops the diff Claude Code prints after a shell command changes files.

## Develop

```sh
claude --plugin-dir .          # run Claude Code with the mod loaded from this folder
claude plugin validate .       # check the manifest, marketplace file and hooks module
claude plugin test .           # run hooks/*.test.tsx
```

Once Claude Code has loaded the mod, it writes the API types to `.claude-plugin/types/` (git-ignored), and `npx -p typescript@5 tsc -p .` type-checks the module against them.
