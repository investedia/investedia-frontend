# Investedia frontend

Recovered repository (private, owner: investedia). No deployment, auth/schema changes or secret changes without the owner's explicit instruction. Keep the news-first design and old public URLs. Edit src/pages and assets/js or assets/css, then build with python build.py. Generated root HTML and docs/ are retained. Never fabricate financial data or rewrite snapshot timestamps. Browser configuration is whitelisted from config.local.json (ignored). Never put a service-role key or Cloudflare token in frontend files. Keep Not investment advice visible. Original code/history and old rules are preserved in the workspace archive.

## Owner rules (all agents: Claude, Codex, others)
The owner is not a developer: explain in plain words and show results.
1. **Nothing goes live without the owner's "push" / "merge".** "Push" from the owner means *put it live*. Agents work on branches (`claude/<task>`, `codex/<task>`), open **draft** pull requests, never push to `main`, never merge.
2. **Security first.** Repositories stay private. Never commit or print secrets (Supabase service-role/secret keys, Cloudflare tokens, Gemini/Pixabay/Resend/Anthropic keys, ingest tokens, `.env`, `.dev.vars`, `config.local.json`). Only the Supabase *publishable* key may reach the browser. Secrets live in provider / GitHub secret stores only. Never weaken RLS, auth or security checks to make something pass.
3. **Keep this repository's structure.** Do not move, flatten or reorganise folders without the owner's approval.
4. **Real data only.** No fabricated articles, prices, quotes or results. Keep "Not investment advice" visible. V5 / Track Record frozen; V7 research-only.
5. **Design:** black, dark-first, minimal, Apple-like (generous whitespace, large clean type, soft glass, subtle motion). Accent orange `#FF7A1A`; green/red only for up/down, shown as a round arrow badge (↑ ↓ ↔), never the words Up/Down. Fonts: Inter (text), Geist Mono (numbers). Wordmark "Investedia" with the font's own i-dot in orange.
6. **Wording:** professional newsroom register (Reuters/Bloomberg). Say "article(s)", never "story/stories" in visible text (code identifiers like `story.html` stay). No "for beginners".
7. **Previews:** show PC 1440 px + phone 390 px screenshots. Label every option on the image itself (A/B/C + 2–3 word name; "Now"/"New"; PC/phone). Options must visibly differ. Always check phone width. If the owner names one device, change only that one.
8. **Globe lines:** homepage globe shows only orange article → affected-asset lines; no trade routes.
9. **Reporting:** list files changed and tests run; separate pre-existing failures from new ones; never hide a failing check.

## Who does what
- **Claude:** Market Overview files (`assets/market-focus-preview.*`, `tools/globe-news/build_market_focus.py`, `tools/market_focus_relevance.py`, `tools/market_overview_evidence.py`), `AGENTS.md` / `CLAUDE.md`, design specs and previews, planning repo `investedia/investedia-investedia-docs`, video/marketing, PR reviews.
- **Codex:** restoring its own earlier work, test fixes, CI, deployment preparation, registry/data plumbing, everything else.
- Need a change in the other agent's files? Comment on its PR instead of editing.
- Plans, task files, tracker and handoffs live in the private repo `investedia/investedia-investedia-docs` (never in public `docs/`).
