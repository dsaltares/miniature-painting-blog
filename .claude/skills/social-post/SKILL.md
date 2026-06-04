---
name: social-post
description: Draft social media posts for a blog post (or any article URL), get approval, then publish via the social-media-automation CLI. Use when the user pastes an article link and wants it posted to social media (Instagram, etc.), or says "post this to <platform>".
---

# Social post from article

Turn an article (usually a post from this blog) into approved, published social media posts.

Input in `$ARGUMENTS`: a URL or post slug, and optionally one or more platform names.

## 1. Pick the article

If no URL/slug was given, list the most recent blog posts (newest first by the `date`
field in their frontmatter):

```sh
grep -H '^date:' content/posts/*/index.md | sort -t: -k2 -r | head -4
```

Then use AskUserQuestion (single-select) with those posts as options — title as the
label, date + description from the frontmatter as the description. If the user wants
something older or external, they can give a URL via "Other".

## 2. Pick platforms

Available platforms are the keys of the `adapters` record in
`social-media-automation/src/cli.ts` (one per adapter in `social-media-automation/src/adapters/`).

- If the user named platform(s), use those.
- Otherwise use AskUserQuestion (multiSelect) to let them pick from the available ones.
  If only one platform exists, just confirm it as part of caption approval instead of
  asking separately.

## 3. Gather content

- **Own blog post** (`miniatures.saltares.com/posts/<slug>/` or a bare slug): read
  `content/posts/<slug>/index.md` and list the images in that bundle. Prefer the local
  source — it's richer than the rendered page.
- **External article**: fetch the page and ask the user which image(s) to use (must be
  public HTTPS JPEG URLs — platforms fetch them, uploads from disk aren't supported).

Deployed image URL pattern for blog posts: `https://miniatures.saltares.com/posts/<slug>/<filename>`.

## 4. Draft captions

Write 2–3 caption variants **per selected platform** — don't reuse one caption across
platforms with different limits and cultures.

Common style:

- First line is the hook. No "Check out my latest post".
- Say what the miniatures are (range, manufacturer, scale if known) and something
  interesting about how they were painted (techniques, colours), pulled from the
  article — not generic filler.

Per platform:

- **Instagram**: 2–4 short paragraphs; plain-text URLs aren't clickable, say "link in
  bio" if pointing at the blog. End with a blank line then 15–25 hashtags mixing big
  community tags (#miniaturepainting #paintingminiatures #wargaming #miniatures) with
  tags specific to the subject (era, game system, manufacturer, technique). Keep well
  under the 2,200-char limit. Carousels take 2–10 images.

## 5. Approve

Use AskUserQuestion to have the user pick a caption variant per platform (show each as
a preview) and confirm image selection/order. Apply any edits they ask for. If the post
has more images than the platform allows, propose the best ones and let them swap.

**Never publish without explicit approval of the final caption + images.**

## 6. Publish

Pre-check that every image URL returns HTTP 200 — for a brand-new blog post this fails
until the post is merged to `main` and deployed; tell the user to deploy first if so.

Then, once per approved platform, from the repo root (Node >= 24, see `social-media-automation/.nvmrc`):

```sh
node social-media-automation/src/cli.ts post <platform> -c "<approved caption>" <image_url> [<image_url>...]
```

The CLI loads tokens from the root `.env`, publishes, and prints the post's permalink.
Relay the permalink(s) to the user. Add `--dry-run` to validate without publishing.

Notes:

- The CLI auto-refreshes tokens after each publish where the platform supports it
  (Instagram tokens last 60 days, so they only expire after 60 days of no posting).
  On auth errors, run `node social-media-automation/src/cli.ts refresh <platform>`;
  if that also fails, the user must regenerate the token (Instagram: Meta app
  dashboard → Instagram → API setup → Generate access tokens) and update `.env`.
- `node social-media-automation/src/cli.ts verify <platform>` checks a token without posting.
- New platforms are added as an adapter in `social-media-automation/src/adapters/` plus
  an entry in the `adapters` record in `cli.ts`, with their token in `.env` and a
  placeholder in `env.sample`.
