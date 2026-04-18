# Generated Single-Post Content

10 travel blog posts × 3 locales (en, vi, zh) generated to match the
`Travel_TVB_Server` Strapi schema at
`src/api/single-post/content-types/single-post/schema.json`.

## Files

| File | What it is |
|------|------------|
| `posts-content.json` | The generated content. 10 posts, each with `en`, `vi`, `zh` fields ready for Strapi. |
| `seed-single-posts.mjs` | Node script that reads `posts-content.json` and POSTs each post to Strapi (all 3 locales). |

## Posts included

| # | Region | Topic |
|---|--------|-------|
| 1 | Northern | Cruising Ha Long Bay — complete travelers' guide |
| 2 | Northern | Sapa's terraced fields — photographer's paradise |
| 3 | Northern | Hanoi Old Quarter street-food walking tour |
| 4 | Northern | Ninh Binh one-day itinerary ("Halong on land") |
| 5 | Northern | Hoi An ancient town — lanterns & slowing down |
| 6 | Southern | Da Lat in three moods (flowers, coffee, mountains) |
| 7 | Southern | Mekong Delta — life on the Nine Dragons river |
| 8 | Southern | Phu Quoc island guide |
| 9 | Southern | Ho Chi Minh City 48-hour walking guide |
| 10 | Southern | Con Dao — the quietest islands of Vietnam |

## Fields populated per locale

- `PostTitle`, `slug` (localized, unique per locale)
- `Content` — Strapi `blocks` format (paragraphs + bold headings, with `[^1]` / `[1^]`
  citation convention used by `SinglePost.jsx`)
- `Audio_Button_Text`, `Audio_Pause_Text`, `Related_Post_Highlight`, `Time_To_Read`
- `PostType` (enum: `Integer` / `TongHop`)
- `TinThiTruong_Type` (enum: `TrongNuoc`)

## Fields NOT populated

- `Featured_Image` and `AudioFile` — upload media in Strapi admin and attach per entry.
- `Social_Link` repeatable component — add via admin if needed.

Relations use the real document IDs already in the DB:

- `post_category` → `te5sele8nyz86j1bpm5owcw9` (Northern Vietnam) or `a9etfp885w0z0uaou5xncs2y` (Southern Vietnam)
- `author` → `byzvbcwncouodi4wey5s5q4p` (Tuan)

## How to import

From the repo root, with the Strapi server running (default `http://localhost:1337`):

```bash
node generated-posts/seed-single-posts.mjs
```

Override the target instance or token via env vars:

```bash
STRAPI_URL=http://srv1488417.hstgr.cloud:3010 \
STRAPI_API_TOKEN=<token> \
node generated-posts/seed-single-posts.mjs
```

The script creates each post in English first, then adds the `vi` and `zh`
localizations on the same Strapi `documentId`, mirroring the flow already used in
`migrate-strapi-locales.mjs`.
