# Security

If you discover a security vulnerability in MacroTrackro, please report it
privately rather than opening a public issue.

**Contact:** open a GitHub issue marked `[security]`, or email adervec@gmail.com.
Please include enough detail to reproduce the issue. I'll aim to respond within
a few days and coordinate a fix before any public disclosure.

Note: this app stores all data locally in a JSON file. It has no user accounts,
no authentication, and no external data transmission. If you deploy it on a
public server, restrict access at the infrastructure level (reverse-proxy auth,
firewall, etc.) — the app itself has no access controls.
