# OUT-2026-home (Homepage + Nav)

This is a **mobile-first, sales-focused** homepage template for **OnlyUsedTesla**.

- No decorative background images
- Clear “what do you want to do?” paths
- Floating **chat** widget (guided wizard)
- Frictionless **login UI** (Google + optional SMS/Twilio Verify)
- Plain HTML/CSS/JS (easy to drop into WordPress, a static host, Next.js, etc.)

## What’s included

- `index.html` — homepage
- `login.html` — dedicated login page (same UX as modal)
- `assets/css/styles.css` — styles
- `assets/js/config.js` — **edit your URLs/endpoints here**
- `assets/js/main.js` — nav + modal wiring
- `assets/js/auth.js` — Google redirect + SMS stub (Twilio Verify)
- `assets/js/chat.js` — chat widget (wizard + optional API hook)

## 1) Edit links + endpoints

Open `assets/js/config.js` and set:

- `links.*` (sell listing, OUT-CHECK, cash offer, shop)
- `auth.googleStartUrl` (your backend route to start Google OAuth)
- optional: `auth.smsStartUrl` + `auth.smsVerifyUrl` (Twilio Verify endpoints)
- optional: `chat.apiUrl` (AI endpoint)

## 2) Google sign-in (recommended “no password” default)

This template assumes you have a backend route like:

- `GET /auth/google?returnTo=/...`

Your backend should:
1. Start the OAuth flow
2. Create a session (cookie)
3. Redirect back to `returnTo`

> UI is ready; you just wire the endpoint.

## 3) SMS sign-in (Twilio Verify) — optional

If you already have Twilio Verify, you can wire these endpoints:

- `POST /auth/sms/start` body: `{ phone: "+1..." }` → `{ success: true }`
- `POST /auth/sms/verify` body: `{ phone: "+1...", code: "123456" }` → `{ success: true }`

When verify succeeds, set a session cookie and redirect.

## 4) Chat widget

### What it does today (no AI needed)
- Guides users into:
  - Create listing (collects model/year/mileage/location/price)
  - OUT-CHECK (VIN prompt + link)
  - Cash offer (collects basics + link)
  - Shop (links)

### Add AI later (optional)
If you create an endpoint like `POST /api/chat`, the widget will call it:
- Request: `{ message, context }`
- Response: `{ reply, quickReplies?: string[] }`

If the endpoint is missing, the widget still works via the built-in guided flow.

## Notes
- Social proof section links to an archived Reddit thread.
- FAQ section is intentionally transparent: marketplace today, escrow/checkout later.

---
Generated for the **OUT-2026-home** repo.
