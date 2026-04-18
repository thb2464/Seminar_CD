/**
 * Single-Post Seeder (10 posts × 3 locales)
 * =========================================
 * Reads generated-posts/posts-content.json and creates each post in Strapi
 * for all three locales (en, vi, zh).
 *
 * Strategy per post (mirrors migrate-strapi-locales.mjs):
 *   1. POST /api/single-posts?locale=en  -> creates en entry (returns documentId)
 *   2. PUT  /api/single-posts/{docId}?locale=vi -> creates vi localization
 *   3. PUT  /api/single-posts/{docId}?locale=zh -> creates zh localization
 *
 * Run from the repo root:
 *   node generated-posts/seed-single-posts.mjs
 *
 * Requires:
 *   - Strapi running locally at http://localhost:1337 (or adjust STRAPI_URL)
 *   - A valid API token with write permissions on single-post
 *   - post_category and author content types already seeded
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN =
  process.env.STRAPI_API_TOKEN ||
  '3f031e1d4d40388df56a5ee3701bf4b5e9ca5efddd543c15af42d2ed2f24a723031914adea35628711b5574a317f20ea14841d1c165e728f7ff0753f3ad7b3b5cba03012abdb0663c41234478d3682c1050ea5f272c1547379fb4be75c6b5842e9b53f9fe939446cde3c7ddbe6fd1dafe00cc65503c83ebc0871bf819d3e782e';

const DATA_FILE = path.join(__dirname, 'posts-content.json');

// ── Helpers ─────────────────────────────────────────────────────────
async function request(method, urlPath, body) {
  const res = await fetch(`${STRAPI_URL}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function logOK(msg)  { console.log(`  ✅ ${msg}`); }
function logERR(msg, d) { console.error(`  ❌ ${msg}`, d ? JSON.stringify(d).slice(0, 300) : ''); }

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Seeding Single-Post entries (10 posts × 3 locales)...\n');

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const payload = JSON.parse(raw);
  const posts = payload.posts;

  let ok = 0, fail = 0;

  for (const post of posts) {
    console.log(`\n📄 ${post.documentId}`);

    // Build localized bodies from the JSON file
    const buildBody = (lc) => {
      const l = post.locales[lc];
      return {
        data: {
          PostTitle: l.PostTitle,
          slug: l.slug,
          Audio_Button_Text: l.Audio_Button_Text,
          Audio_Pause_Text: l.Audio_Pause_Text,
          Related_Post_Highlight: l.Related_Post_Highlight,
          Time_To_Read: l.Time_To_Read,
          PostType: l.PostType,
          TinThiTruong_Type: l.TinThiTruong_Type,
          Content: l.Content,
          post_category: post.post_category.documentId,
          author: post.author.documentId,
          publishedAt: new Date().toISOString(),
        },
      };
    };

    // 1) Create in English (default locale). Capture the real Strapi-assigned documentId.
    const enRes = await request('POST', '/api/single-posts?locale=en', buildBody('en'));
    if (enRes.status !== 200 && enRes.status !== 201) {
      logERR(`[en] create failed (${enRes.status})`, enRes.body);
      fail++;
      continue;
    }
    const createdDocId = enRes.body?.data?.documentId;
    if (!createdDocId) {
      logERR('[en] created but no documentId returned', enRes.body);
      fail++;
      continue;
    }
    logOK(`[en] created: ${post.locales.en.PostTitle}  →  ${createdDocId}`);
    await sleep(200);

    // 2) Add Vietnamese localization on the same document
    const viRes = await request('PUT', `/api/single-posts/${createdDocId}?locale=vi`, buildBody('vi'));
    if (viRes.status === 200) logOK(`[vi] ${post.locales.vi.PostTitle}`);
    else { logERR(`[vi] failed (${viRes.status})`, viRes.body); fail++; }
    await sleep(200);

    // 3) Add Chinese localization on the same document
    const zhRes = await request('PUT', `/api/single-posts/${createdDocId}?locale=zh`, buildBody('zh'));
    if (zhRes.status === 200) logOK(`[zh] ${post.locales.zh.PostTitle}`);
    else { logERR(`[zh] failed (${zhRes.status})`, zhRes.body); fail++; }
    await sleep(200);

    ok++;
  }

  console.log(`\n══════════════════════════════════════════`);
  console.log(`Done. Posts created: ${ok}, failures: ${fail}.`);
  console.log(`Expect ~${ok * 3} total Strapi entries (incl. all locales).`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
