# Bilingual al-folio site (English + 中文) — Design

**Date:** 2026-05-08
**Author:** Chunzhuo Zhang (with Claude)
**Status:** Approved design, pending implementation plan

## Goal

Make `chunzhuo.github.io` a hand-written bilingual site so visitors can read every page (and the user's real blog posts) in either English or simplified Chinese, with a language switcher in the navbar and localized theme strings.

## Non-goals

- Auto-translation (machine translation widgets) — explicitly rejected.
- Chinese versions of al-folio template demo posts (~30 of them in `_posts/` dating 2015–2025). Only the user's real content gets Chinese versions.
- Localized search in Phase 1. The al-folio search index stays English-only.
- Translating bibliography entries (`_bibliography/papers.bib`).

## Approach

Use the `jekyll-polyglot` plugin for routing and per-language site generation, plus a `_data/strings/{en,zh}.yml` dictionary for theme UI strings. Polyglot handles URL prefixing and per-page language tagging; the strings dictionary handles all UI chrome that isn't part of a `_pages/` body.

### Why polyglot over manual page duplication

A manual approach (no plugin, just `_pages/zh/about.md` with explicit `permalink: /zh/`) was considered. It's simpler but does not localize navbar / footer / "next post" / archive titles, and it provides no built-in language switcher. The user explicitly chose full theme localization, which makes polyglot's per-language site generation worth the dependency.

## URL & file layout

```
/                            English (default_lang)
/zh/                         Chinese mirror at the same paths

_pages/about.md              lang: en
_pages/zh/about.md           lang: zh
_pages/cv.md                 lang: en
_pages/zh/cv.md              lang: zh
…and same pattern for blog.md, books.md, news.md, off-hours.md,
   reports.md, repositories.md, 404.md

_posts/2026-05-07-multimodality-for-biology.md       lang: en
_posts/zh/2026-05-07-multimodality-for-biology.md    lang: zh
   (only the user's real post; ~30 demo posts get NO Chinese version)

_data/strings/en.yml         theme strings (nav, footer, search, post meta)
_data/strings/zh.yml         same keys, Chinese values

_includes/lang_switcher.liquid    new include — EN | 中文 toggle

docs/superpowers/specs/2026-05-08-bilingual-site-design.md  this file
```

`docs/` is added to `_config.yml`'s `exclude:` list so Jekyll doesn't publish it.

## Components

### 1. Plugin & config

- Add `gem "jekyll-polyglot"` to `Gemfile`.
- `bundle install` to refresh `Gemfile.lock`.
- In `_config.yml` add:

  ```yaml
  languages: ["en", "zh"]
  default_lang: "en"
  exclude_from_localization: ["assets", "robots.txt", "sitemap.xml", "_bibliography"]
  parallel_localization: true
  ```

  Note: `_config.yml` already has a top-level `lang: en` (line 17) used by al-folio for the `<html lang>` attribute. This is unrelated to polyglot's `default_lang` / `languages` keys. Both coexist; polyglot will override the HTML `lang` attribute per-page based on the page's `lang:` front-matter via the `<html lang="{{ site.active_lang }}">` pattern in the layout.

- Add `jekyll-polyglot` to the `plugins:` list.
- Add `docs` to `exclude:` so the spec dir is not published.

### 2. Front-matter migration

Every existing user-authored page/post in `_pages/` and `_posts/` gets a `lang: en` line added. (The al-folio template demo posts also get `lang: en` so polyglot's filtering treats them consistently — they will simply have no Chinese counterpart.)

### 3. Chinese stub files

For each English page in `_pages/` (real ones — about, cv, blog, books, news, off-hours, reports, repositories, 404), create `_pages/zh/<same>.md` with:

- `lang: zh`
- Same `permalink:` as English (polyglot prefixes `/zh/` automatically).
- A title placeholder in Chinese (e.g., `title: 关于`).
- Body containing only an HTML comment placeholder: `<!-- TODO: 翻译此页面 -->`.

For the user's one real post `_posts/2026-05-07-multimodality-for-biology.md`, create `_posts/zh/2026-05-07-multimodality-for-biology.md` with the same front-matter except `lang: zh`, body as a TODO placeholder.

### 4. Theme string dictionary

`_data/strings/en.yml` keys (initial set — will grow as more strings are discovered during the layout sweep):

```yaml
nav:
  about: about
  blog: blog
  publications: publications
  cv: cv
  books: books
  news: news
  repositories: repositories
  reports: reports
  off_hours: off-hours
footer:
  built_with: "Powered by Jekyll with al-folio theme."
search:
  placeholder: "Search..."
  no_results: "No results found."
post:
  next: "Next post"
  previous: "Previous post"
  read_more: "Read more"
  reading_time: "{{minutes}} min read"
  tags: "Tags"
common:
  date_format: "%b %-d, %Y"
```

`_data/strings/zh.yml` ships with the same keys and **English values** as fallback, with Chinese values left for the user to fill in. (Empty Chinese values would render as blanks in the UI; English fallback is safer until the user translates.)

### 5. Layout/include refactor

Sweep al-folio's `_includes/` and `_layouts/` for hardcoded user-facing strings. For each, replace with `{{ t.<key> }}` after assigning `{% assign t = site.data.strings[site.active_lang] %}` once at layout top.

Targets known up front (more will surface during the sweep):

- `_includes/header.liquid` — navbar labels.
- `_includes/footer.liquid` — copyright/built-with.
- `_includes/scripts/search.liquid` — search placeholder/no-results.
- `_layouts/post.liquid` — next/previous, reading time, tags.
- `_layouts/page.liquid` — anything similar.

The sweep is an explicit step in the plan because al-folio has hardcoded English strings in several places that are easy to miss on first pass. We expect a small follow-up after the first deploy to mop up any stragglers.

### 6. Language switcher

`_includes/lang_switcher.liquid`:

```liquid
{% assign current_path = page.url | remove_first: '/zh' %}
{% if current_path == '' %}{% assign current_path = '/' %}{% endif %}
<span class="lang-switcher">
  {% for lang in site.languages %}
    {% if lang == site.active_lang %}
      <strong>{{ lang | upcase }}</strong>
    {% else %}
      {% if lang == site.default_lang %}
        <a href="{{ current_path | relative_url }}">EN</a>
      {% else %}
        <a href="{{ '/' | append: lang | append: current_path | relative_url }}">中文</a>
      {% endif %}
    {% endif %}
    {% unless forloop.last %} | {% endunless %}
  {% endfor %}
</span>
```

Mounted in `_includes/header.liquid` next to the social toggle / theme toggle. Styling reuses existing navbar link styles.

## Build / deploy

- `Gemfile.lock` will change — committed.
- The Docker dev container (`docker-compose up`) re-runs `bundle install` on rebuild and will pick up polyglot.
- GitHub Actions deploy (`.github/workflows/deploy.yml`) runs `bundle install` already; no workflow change expected. If polyglot pulls in native deps that aren't in the runner image, we'll add them.
- al-folio's prettier and CI workflows are unaffected.

## Phasing

**Phase 1 — scaffolding (Claude does all of this in one PR):**
1. Add polyglot to Gemfile + config.
2. Add `lang: en` to every existing page/post.
3. Create `_data/strings/{en,zh}.yml`.
4. Refactor layouts/includes to use the strings dictionary.
5. Add `_includes/lang_switcher.liquid` and mount it in the navbar.
6. Create empty Chinese stub files for real content (no demo posts).
7. Add `docs` to Jekyll exclude list.
8. Verify English site renders identically; Chinese site builds without errors (pages may be near-empty).

**Phase 2 — content (user does):**
9. Fill in `_pages/zh/*.md` with Chinese translations.
10. Fill in `_posts/zh/2026-05-07-multimodality-for-biology.md`.
11. Fill in Chinese values in `_data/strings/zh.yml`.

**Phase 3 — follow-up (deferred, if needed):**
12. Sweep for any hardcoded strings missed in Phase 1 sweep.
13. Optional: localize search index per language.
14. Optional: localize bibliography entry titles.

## Acceptance criteria for Phase 1

- `bundle exec jekyll build` succeeds with no errors.
- `docker compose up` serves the site at `http://localhost:8080`.
- `/` renders English content identical to today's site (no visual regression).
- `/zh/` renders the Chinese mirror with empty placeholder content; navbar/footer/UI strings show English fallback (because Chinese strings not yet filled in).
- The language switcher in the navbar links between equivalent pages.
- All ~30 demo posts continue to render at their existing English URLs; no Chinese versions exist for them.
- Existing English search continues to work.

## Risks & known limitations

1. **al-folio search:** Phase 1 keeps search English-only. Visiting `/zh/` and using search returns English results; Chinese pages are not indexed. Phase 3 task.
2. **Hidden hardcoded strings:** Some al-folio strings are in JavaScript files (`_scripts/*.liquid.js`) or layouts not on the initial sweep list. We will fix these as found.
3. **al-folio template upgrades:** Future merges from upstream al-folio may reintroduce English-only strings. Document the pattern in `AGENTS.md` so future changes preserve the dictionary refactor.
4. **RSS / sitemap / archives:** polyglot generally handles these correctly, but verify after first build.
5. **`Gemfile.lock` churn:** adding polyglot may bump transitive deps; keep an eye on the diff.
6. **Empty Chinese blog list:** until the user fills in `_posts/zh/2026-05-07-multimodality-for-biology.md`, the `/zh/blog/` page will be near-empty (only the placeholder shows up). This is expected and resolves itself when the user translates the post.
