# Aurora — Music Subscriptions (Redesigned)

A complete UI/UX overhaul of the music subscription web app. The frontend is a **drop-in replacement** for the original: every API Gateway endpoint, request/response contract, and the S3 image pattern are preserved exactly, so it works against your existing AWS backend with no changes required.

## What changed

The original was a functional but plain three-page app (lavender theme, `alert()` popups, broken image icons, no mobile layout). This redesign keeps the same behaviour and the same AWS stack while delivering a premium, accessible product.

**Design** — A sophisticated dark "music-app" aesthetic: animated aurora background, glassmorphism cards, a custom gradient brand identity (Space Grotesk + Inter type), album-art-forward result cards, and smooth micro-interactions throughout.

**UX** — `alert()` popups replaced with elegant non-blocking toast notifications; skeleton loaders while data loads; friendly empty and error states; loading spinners on buttons; graceful image fallback (artist initial on a gradient) when an S3 photo is missing; live password strength meter and inline validation on the auth forms; show/hide password toggles.

**Responsive & accessible** (the requested feature focus) — Mobile-first layout that adapts from a multi-column grid down to phones; semantic HTML landmarks; skip-to-content link; ARIA live regions for results, toasts, and validation; `aria-invalid` + described-by error messaging; visible keyboard focus rings; and full `prefers-reduced-motion` support that disables animation for users who need it.

## File structure

```
AWS/
├── index.html            # Sign in
├── register.html         # Create account
├── main.html             # Search + library (the app)
├── assets/
│   ├── css/styles.css     # Shared premium dark design system
│   └── js/
│       ├── config.js      # API config (UNCHANGED endpoints) + toasts + helpers
│       ├── login.js
│       ├── register.js
│       └── main.js
├── README.md
└── BACKEND_NOTES.md       # Optional, free-tier-safe backend enhancements
```

## Preserved API contracts

Base: `https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production`

| Endpoint | Request | Response used |
|---|---|---|
| `/login` | `{email, password}` | `result: "true"` |
| `/register` | `{email, user_name, password}` | `success`, `message` |
| `/user_area` | `{email}` | `user_name` |
| `/query_lambda_function` | `{title, year, artist}` | `[{title, artist, year}]` |
| `/subscribe_or_remove_lambda_function` | `{email, action}` where action ∈ `create / fetch / subscribe / remove` (subscribe & remove include `music_info`) | `subscriptions[]` / `result: "success"` |

Artist images: `https://3994442.s3.amazonaws.com/{ArtistNameNoSpaces}.jpg` (unchanged).

## Deploy (same as before — S3 static hosting, free tier)

Upload the contents of this folder to your S3 website bucket (keep the `assets/` subfolders intact — paths are relative):

```bash
aws s3 sync . s3://YOUR-WEBSITE-BUCKET/ --exclude "*.md"
```

`index.html` remains the entry point. No build step, no dependencies — just static files and Google Fonts over CDN.

## Free-tier notes

Nothing here adds cost: the app is still static files on S3 talking to the same Lambda/API Gateway/DynamoDB. All new functionality (toasts, skeletons, validation, strength meter, fallback art, responsive/a11y) is client-side. See `BACKEND_NOTES.md` for optional enhancements you can deploy, each chosen to stay within the AWS Free Tier.
