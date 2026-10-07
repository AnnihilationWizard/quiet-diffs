# Contributing

Thank you for helping improve quiet-diffs. It is a small Claude Code mod written as a plugin of function hooks. Start with the [README](README.md).

## Report a bug

Use the [issue tracker](https://github.com/AnnihilationWizard/quiet-diffs/issues). Include:

- The quiet-diffs version, Claude Code version (`claude --version`) and operating system.
- The surface: terminal (fullscreen or classic renderer), desktop app or IDE.
- The tool whose result looked wrong (`Edit`, `Write`, `NotebookEdit`) and what you expected to see.
- Any transcript line that names `quiet-diffs`, such as `quiet-diffs: ui.render (ToolResult) refused: …`.

Never paste source code, file contents or paths you are not allowed to share. For security concerns, follow [SECURITY.md](SECURITY.md).

## Propose a change

Open an issue that describes the problem and the intended behavior before a broad change. Keep changes focused: the mod should only change how results are drawn, never the stored tool result or what the model reads.

## Develop and verify

Run from the repository root:

```bash
claude plugin validate .
claude plugin test .
npx -p typescript@5 tsc -p .
```

The type-check needs the types Claude Code writes to `.claude-plugin/types/` the first time it loads the mod, for example with `claude --plugin-dir .`.

For behavior changes, add or update a test in `hooks/register.test.tsx`. Test on at least the `terminal` and `desktop` surfaces, as the existing tests do.

## Submit a pull request

- Explain the problem and the resulting behavior.
- List the checks you ran and their results.
- Update the README and CHANGELOG when behavior changes.
- Use a Conventional Commit message, such as `fix: count lines in an empty new file`.
