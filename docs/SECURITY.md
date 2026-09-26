# Security model

ADA treats model output as untrusted input.

## Defaults

SAFE: task reads/creates, approved memory notes, allow-listed file reads, Google read context, GitHub status, allow-listed apps/URLs.

ASK: diagnostic commands, Home Assistant changes, phone calls, sending mail, Git pushes and file deletion.

BLOCK: arbitrary shell, purchases, money movement, security changes and secret reads.

Unknown actions default to ASK.

## Required practices

- Keep ADA bound to 127.0.0.1 unless protected by an authenticated private network.
- Never commit .env, OAuth tokens, PATs, telephony credentials or voice secrets.
- Start Google and GitHub integrations read-only.
- Do not run ADA as Windows Administrator for normal use.
- Verify provider signatures and rate-limit any public voice bridge.
- Review the audit log after adding new tools.
- Never allow model output to construct arbitrary shell commands.
