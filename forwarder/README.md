# Contact Email Forwarder (SMTP relay)

Netlify Functions often cannot reliably connect to outbound SMTP (465/587). This tiny service receives the contact-form payload from Netlify, verifies an HMAC signature, then sends email via your existing 163 SMTP (`smtp.qiye.163.com:465`).

## Run

```bash
cd forwarder
node server.mjs
```

Health check:

```bash
curl http://localhost:8787/health
```

## Required env vars

- `CONTACT_FORWARD_SECRET`: shared secret used to verify requests from Netlify
- `SMTP_HOST`: default `smtp.qiye.163.com`
- `SMTP_PORT`: default `465`
- `SMTP_USER`: e.g. `BD@chivox.com`
- `SMTP_PASS_B64`: base64 of the SMTP auth code (recommended)
  - or `SMTP_PASS` (avoid if it contains `$`)
- `SALES_TO`: default `BD@chivox.com`

Optional:

- `PORT`: default `8787`
- `SMTP_TIMEOUT_MS`: default `10000`
- `SMTP_SECURE`: set `true/false` to override port-based detection
- `MAX_SKEW_MS`: max timestamp skew for signature verification (default 300000 / 5min)

## Netlify env vars (website)

Set these on the Netlify site:

- `CONTACT_FORWARD_URL`: `https://<your-forwarder-host>/contact`
- `CONTACT_FORWARD_SECRET`: same as above
- `CONTACT_FORWARD_TIMEOUT_MS`: optional, default 10000

Once `CONTACT_FORWARD_URL` is set, the website will **prefer the forwarder** and will not depend on SMTP connectivity from Netlify.

