# Bilingual site — Phase 2 handoff

Phase 1 (scaffolding) is complete on branch `bilingual-site`. The site builds and `/zh/` is live with placeholder content. To finish the Chinese site:

## What you need to do

### 1. Translate page bodies

Open each file under `_pages/zh/` and replace the English body content with Chinese. Files to edit (in priority order):

- `_pages/zh/about.md` — homepage (highest priority)
- `_pages/zh/cv.md` — title is set; CV PDF download still uses the English-language PDF since you only have one CV file
- `_pages/zh/blog.md` — list page; the listing logic is identical to English so it just shows whatever Chinese posts exist
- `_pages/zh/off-hours.md` — translate the intro paragraph
- `_pages/zh/books.md` — translate the Carl Sagan quote and section heading
- `_pages/zh/repositories.md` — translate the section headings ("GitHub users", "GitHub Repositories")
- `_pages/zh/news.md` — empty layout-driven page; nothing to translate unless you add news items
- `_pages/zh/reports.md` — translate the description (already done) and any bibliography content if you add Chinese entries
- `_pages/zh/404.md` — already translated

The front matter (`title:`, `lang: zh`, `permalink:`, etc.) is already correct — only edit content below the second `---`.

### 2. Translate your blog post

`_posts/zh/2026-05-07-multimodality-for-biology.md` — translate title (already done as "生物学中的多模态融合"), description, body. The English source is at `_posts/2026-05-07-multimodality-for-biology.md`.

### 3. Translate UI strings

Open `_data/strings/zh.yml`. Each line has a `# TODO 翻译:` comment with a suggested Chinese translation. Replace each English value with the Chinese equivalent. Example:

```yaml
nav:
  toggle: "切换导航"
  search_hint: "ctrl k"
  search_title: "搜索"
  translate_title: "翻译"
  theme_title: "切换主题"

footer:
  last_updated: "最近更新"
```

### 4. Verify

After each batch of edits, push the branch and check the GitHub Actions deploy log. When you're satisfied with the Chinese site, merge `bilingual-site` → `main`.

## What was deliberately left out (Phase 3 candidates)

- **Search** is English-only. Searching on `/zh/` returns English results. To localize: build a separate Chinese index, conditionally include based on `site.active_lang`.
- **Bibliography** (`_bibliography/papers.bib`) is not localized. Reports/publications stay English. It's added to `exclude_from_localization` in `_config.yml`.
- **Hardcoded strings in deeper layouts** (e.g., `_layouts/post.liquid` next/previous, `_includes/pagination.liquid`, `_includes/related_posts.liquid`) are not yet in the strings dictionary. As you notice English text leaking onto Chinese pages, add the key to `_data/strings/{en,zh}.yml` and a `{{ t.<key> }}` lookup in the relevant layout file.
- **Demo posts** (`_posts/2015-*` through `_posts/2025-*`) have no Chinese versions — by design.

## Architecture summary

- Plugin: `jekyll-polyglot` (added to `Gemfile` and `_config.yml`)
- Languages: `en` (default), `zh`
- URL scheme: English at root (`/`, `/cv/`, ...), Chinese mirrored under `/zh/` (`/zh/`, `/zh/cv/`, ...)
- Page tagging: every page/post has `lang: en` or `lang: zh` in front matter
- Theme strings: `_data/strings/{en,zh}.yml`, looked up via `{% assign t = site.data.strings[site.active_lang] %}` in `_layouts/default.liquid`
- Language switcher: `_includes/lang_switcher.liquid` mounted in the navbar (`_includes/header.liquid`); replaces the previous Google Translate widget
