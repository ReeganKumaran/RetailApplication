# Email / SMTP Configuration

This app sends email via Nodemailer. SMTP settings are now configurable via env vars, with safe defaults for Gmail over STARTTLS (port 587).

## Quick setup (Gmail)

1) Enable 2-Step Verification on your Google account.
2) Create an App Password (16 characters) in Google Account > Security > App Passwords.
3) Create a `.env` based on `.env.example`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_16_char_app_password
```

`GMAIL_USER` and `GMAIL_APP_PASSWORD` are also supported for backward compatibility.

## Connectivity checks

If you see `ESOCKET connect ETIMEDOUT ...:465` or similar:

- Prefer port 587 (STARTTLS). Many networks block 465.
- On Windows PowerShell: `Test-NetConnection smtp.gmail.com -Port 587`
- On Linux/mac: `nc -vz smtp.gmail.com 587`

If these fail, your host/network may block SMTP egress. Use an email API (SendGrid/Mailgun/SES) or request an unblock from your provider.

## Timeouts and TLS

Optional envs to tweak behavior (defaults in `.env.example`):

- `SMTP_CONNECTION_TIMEOUT`, `SMTP_GREETING_TIMEOUT`, `SMTP_SOCKET_TIMEOUT`
- `SMTP_TLS_REJECT_UNAUTHORIZED=false` for debugging only (don’t use in prod)

