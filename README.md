# image-editor-elliesbang

This project ships all backend capabilities as Netlify Functions that live in `./netlify/functions`. The most common endpoints are exposed automatically under `/.netlify/functions/*` at runtime and proxied from `/api/*` for compatibility with older clients.

## Environment variables

Netlify must expose the following secrets to the functions runtime:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

Use the helper script to configure them via the Netlify CLI:

```bash
./scripts/setup-netlify-env.sh
```

## Local development

```bash
npm install
npm run dev
```
