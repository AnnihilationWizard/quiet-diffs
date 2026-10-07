# Changelog

## [1.1.0] - 2026-10-07

- Summary lines are now in English: `Edited`, `Created` and `Overwrote`, with `line` or `lines` for new files.
- `/quiet-diffs` description and confirmation messages are now in English.
- README illustration and examples updated to match.

## [1.0.0] - 2026-10-07

Initial release of quiet-diffs by AnnihilationWizard.

- One-line summaries in place of the diff for `Edit`, `Write` (new file and overwrite) and `NotebookEdit` results in the Claude Code transcript.
- Added and removed line counts from the edit's structured patch; new-file line counts ignore a trailing newline.
- `/quiet-diffs` command that toggles the full diff back on for the session.
- Claude Code's own rendering kept for failed edits, edits held for review and all other tools.
- Marketplace file so the repository installs with `/plugin install quiet-diffs --marketplace AnnihilationWizard/quiet-diffs`.
- Tests for summaries, fallbacks and the toggle, run with `claude plugin test`.
- English README with a before-and-after illustration, install and usage instructions, contribution guidance and security notes.

Built on Claude Code's early-access function-hooks mod API and tested against Claude Code 2.1.292.

[1.1.0]: https://github.com/AnnihilationWizard/quiet-diffs/releases/tag/v1.1.0
[1.0.0]: https://github.com/AnnihilationWizard/quiet-diffs/releases/tag/v1.0.0
