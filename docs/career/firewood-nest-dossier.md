# firewood-nest

Backend for [firewood.news](https://firewood.news) (积薪), a directory of independent
Chinese-language blogs. It crawls RSS feeds, classifies articles with an LLM, tracks
which links have gone dead, and serves the public site over a read-only JSON API.

Solo side project, and my first real backend. Built August 2023, maintained through
August 2024.

## Stack

NestJS 10 on Node 20, MongoDB via Mongoose 8, JWT with bcrypt for the single admin
account, `@nestjs/schedule` for cron, `cache-manager` for an in-process response cache,
cheerio for HTML parsing.

Two external services do work the Node process does not: Supabase Edge Functions host
the RSS parser, the article extractor and the LLM call, and Cloudflare Images stores
article cover images.

## Scale (measured)

| Metric | Value | How it was measured |
|---|---|---|
| Commits | 65 | `git log --oneline \| wc -l` |
| Active period | 2023-08-23 to 2024-08-07 | first and last commit |
| Tracked files | 57 | `git ls-files \| wc -l` |
| Source lines | 2,036 (1,888 application, 148 test) | `git ls-files 'src/**' \| xargs wc -l` |
| HTTP route handlers | 33 | route decorators in `src/**/*.controller.ts` |
| Mongoose schemas | 4 | `src/schemas/` |
| Scheduled jobs | 3 | `@Cron` in `src/auto/auto.service.ts` |
| Contributors | 1 | `git shortlog -sne` |

Traffic, article counts and site counts are not in the repository. They live in the
production `Statistic` collection (`src/schemas/statistic.schema.ts`), so they are not
included here.

## Architecture

```
frontend  ──HTTP──>  NestJS single process (port 1994)
                       │
                       ├─ ArticleController / WebsiteController / AuthController
                       ├─ AutoService — 3 cron jobs
                       └─ global CacheInterceptor (in-process memory)
                       │
                       ├──> MongoDB (website, article, user, statistic)
                       ├──> Supabase Edge Functions (/rss, /article, /open-ai)
                       └──> Cloudflare Images
```

The three scheduled jobs in `src/auto/auto.service.ts`:

- **Feed crawl** (`:28`) walks every registered site's RSS feed and saves new articles.
- **Link check** (`:55`) fetches 1,000 articles a day with `HEAD`, offset by day of
  month so the full library is covered once per month. An article is deleted after four
  consecutive failures (`:85`).
- **Daily snapshot** (`:109`) writes site count, article count and unreachable-article
  count into the `Statistic` collection.

## Things worth talking about

**Incremental crawling.** Each new article costs one LLM call and one image upload, so
the feed walk stops at the first article already in the database rather than reading the
whole feed (`src/blog/article/article.service.ts:205-207`, commit `161cafd`). The
tradeoff: if a feed is not strictly reverse-chronological, entries after the stop point
are skipped permanently.

**Constraining LLM output.** The model returns a free-text Chinese category. A 12-entry
map converts it to an English slug and falls back to `others` on anything unrecognised
(`src/common/get-english-topic.ts:18-22`), so an unexpected answer cannot introduce a new
category into the data. Around it, the extractor retries three times with a 1-3s random
backoff and saves the article without AI fields if the LLM never answers
(`src/common/article-extract.ts:22-77`).

**Moving parsing out of the process.** Commit `aac4d41` (2024-01) removed
`@extractus/article-extractor` and `@extractus/feed-extractor` and replaced both with
calls to Supabase Edge Functions, taking HTML parsing out of the long-running Node
process.

**Swapping LLM providers cheaply.** The provider changed five times (Cloudflare Workers
AI, Supabase, OpenAI, Claude, back to OpenAI: commits `9aba976`, `40d7ecd`, `f381c66`,
`10a70ab`, `8fec2aa`). Because the call sits behind one edge-function URL, four of those
five changes were a one-line diff in `src/common/open-ai.ts`.

## Known gaps

Listed so I can answer for them rather than be surprised by them.

- **The test suite does not run.** All 8 spec files are `nest generate` scaffolding.
  `npx jest` gives 7 failed suites, 1 passed; 2 failed tests, 1 passed. Nothing mocks the
  injected `JwtService` or Mongoose models, so those suites have never compiled.
- **No CI and no deployment config.** `.github/` never existed; the `Dockerfile` was
  deleted in commit `61f6726` and `docker-compose.yml` is gitignored.
- **The response cache expires in 14 seconds, not 4 hours.** `cache-manager` v5 takes TTL
  in milliseconds, but `src/app.module.ts:22` sets `ttl: 14400` as if it were seconds. I
  verified this: a key written with that config is gone at 15s. Per-route overrides like
  `@CacheTTL(900)` are 900ms.
- **DTO validation never ran.** Five DTOs carry `class-validator` decorators, but
  `app.useGlobalPipes(new ValidationPipe())` is missing from `src/main.ts` and appears
  nowhere in the history, so request bodies reach Mongoose unchecked.
- **The JWT secret is committed and the two ends disagree.** Tokens are signed with a
  hardcoded constant (`src/common/constants.ts:1`, used at `src/auth/auth.module.ts:15`)
  and verified against `process.env.AUTH_KEY` (`src/auth/auth.guard.ts:24`).
- **Two unauthenticated routes need guards.** `GET /website/check?url=` fetches any URL a
  caller supplies (`src/blog/website/website.controller.ts:170`), and `POST /website/update`
  triggers a crawl with no guard (`:162`).
- **A memory fix I got wrong.** Commit `92d6ca8` paginated the cron's site query; I
  reverted it two days later in `27d4b7d`. The real cost is elsewhere:
  `updatePageView` loads every article of a site into memory to sum page views and build
  a category histogram (`src/blog/website/website.service.ts:197-220`), which belongs in
  an aggregation pipeline.
- **Seven compiler options are silently ignored.** Commit `2aa867a` moved
  `skipLibCheck`, `strictNullChecks` and five others out of `compilerOptions` while fixing
  a path alias. They have sat at the top level of `tsconfig.json`, ignored by tsc, ever
  since.

## Resume bullets

- Built the backend for an independent-blog directory: 33 REST endpoints over MongoDB,
  serving article and site data to the public site.
- Wrote three scheduled jobs that crawl RSS feeds every four hours, snapshot site
  statistics nightly, and re-check 1,000 stored links a day for dead URLs.
- Cut crawl cost by stopping each feed walk at the first article already stored, so a
  pass pays for new posts only.
- Sent article text to an LLM for a category, tags and a summary, then mapped its
  free-text category onto a fixed 12-value list so unexpected answers fell back to a
  default instead of entering the data.
- Moved HTML and RSS parsing out of the Node process into external edge functions and
  dropped two parsing libraries from the service.

## To confirm before using this

- Site metrics: blogs indexed, articles stored, monthly visitors.
- Where it is deployed and how many instances run. The response cache is per-process, so
  this changes the answer to an obvious follow-up question.
- Whether MongoDB is self-hosted or Atlas, and whether the 2024-07 memory problem was
  Node heap or MongoDB sort memory. The heavy use of `allowDiskUse(true)` points at
  MongoDB, but I could not confirm it from the code.
- What prompted the January 2024 move to edge functions.
- Whether the service is still running. If it has run unattended since August 2024, that
  is worth saying.

## Resume JSON

```json
{
  "name": "firewood-nest",
  "period": "2023.08 - 2024.08",
  "link": "https://firewood.news",
  "stack": ["NestJS", "TypeScript", "Node.js", "MongoDB", "Mongoose", "JWT", "cron", "LLM API", "Supabase Edge Functions", "Cloudflare Images"],
  "description": "Backend for an independent-blog directory. Crawls RSS feeds, classifies articles with an LLM, tracks dead links, and serves the public site over a read-only JSON API. Solo side project.",
  "bullets": [
    "Built the backend for an independent-blog directory: 33 REST endpoints over MongoDB, serving article and site data to the public site.",
    "Wrote three scheduled jobs that crawl RSS feeds every four hours, snapshot site statistics nightly, and re-check 1,000 stored links a day for dead URLs.",
    "Cut crawl cost by stopping each feed walk at the first article already stored, so a pass pays for new posts only.",
    "Sent article text to an LLM for a category, tags and a summary, then mapped its free-text category onto a fixed 12-value list so unexpected answers fell back to a default instead of entering the data.",
    "Moved HTML and RSS parsing out of the Node process into external edge functions and dropped two parsing libraries from the service."
  ]
}
```
