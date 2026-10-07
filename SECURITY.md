# Security Notes

quiet-diffs only changes how Claude Code draws file-edit results in the transcript. These notes describe what it can reach; they do not establish a support SLA.

## What the mod does

- It hooks `ui.render` for `ToolResult` and draws one line of text from the result Claude Code already holds.
- It registers the `/quiet-diffs` command and keeps one session value, whether full diffs are shown.
- It does not read or write files, run processes, make network requests, change settings or alter what the model reads.

Hiding a diff makes changes less visible during a session. Review the full diff with `/quiet-diffs`, `git diff` or your editor before you commit or ship changes.

## Report a security concern

If this repository offers GitHub private vulnerability reporting, use the **Report a vulnerability** option on its [Security page](https://github.com/AnnihilationWizard/quiet-diffs/security). This document does not assume that the option is enabled.

If no private reporting option is available, open a minimal issue asking the maintainer to arrange a private channel. Do not publish exploit details, credentials or private code in that issue.

Include the affected version, Claude Code version, environment, steps to reproduce and impact. No response-time or supported-version guarantee is currently stated.
