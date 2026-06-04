---
name: instagram-post
description: Draft Instagram captions for a blog post (or any article URL), get approval, then publish to @saltares.miniatures via the social-media-automation CLI. Use when the user pastes an article link and wants a social media post, or says "post this to Instagram".
---

# Instagram post from article

Turn an article (usually a post from this blog) into an approved, published Instagram post.

Input: a URL or post slug in `$ARGUMENTS`. If missing, ask for it.

## 1. Gather content

- **Own blog post** (`miniatures.saltares.com/posts/<slug>/` or a bare slug): read
  `content/posts/<slug>/index.md` and list the images in that bundle. Prefer the local
  source — it's richer than the rendered page.
- **External article**: fetch the page and ask the user which image(s) to use (must be
  public HTTPS JPEG URLs — Instagram fetches them, it won't accept uploads from disk).

Deployed image URL pattern for blog posts: `https://miniatures.saltares.com/posts/<slug>/<filename>`.

## 2. Draft captions

Write 2–3 caption variants. Style:

- First line is the hook — it's all that shows before "more". No "Check out my latest post".
- 2–4 short paragraphs: what the miniatures are (range, manufacturer, scale if known),
  something interesting about how they were painted (techniques, colours), pulled from
  the article — not generic filler.
- Plain-text URLs aren't clickable in captions; say "link in bio" if pointing at the blog.
- End with a blank line then 15–25 hashtags: mix big community tags
  (#miniaturepainting #paintingminiatures #wargaming #miniatures) with tags specific to
  the subject (era, game system, manufacturer, technique).
- Keep well under the 2,200-char caption limit.

## 3. Approve

Use AskUserQuestion to have the user pick a caption variant (show each as a preview) and
confirm image selection/order. Apply any edits they ask for. Carousels take 2–10 images;
if the post has more, propose the best 10 and let them swap.

**Never publish without explicit approval of the final caption + images.**

## 4. Publish

Pre-check that every image URL returns HTTP 200 — for a brand-new blog post this fails
until the post is merged to `main` and deployed; tell the user to deploy first if so.

Then, from the repo root (Node >= 24, see `social-media-automation/.nvmrc`):

```sh
node social-media-automation/src/cli.ts post instagram -c "<approved caption>" <image_url> [<image_url>...]
```

The CLI loads `INSTAGRAM_TOKEN` from the root `.env`, creates the media container(s),
publishes, and prints the post's permalink. Relay the permalink to the user.
Add `--dry-run` to validate images and caption without publishing.

Notes:
- The CLI auto-refreshes the token (rewriting `.env`) after each publish, so it only
  expires after 60 days of no posting. On auth errors, run
  `node social-media-automation/src/cli.ts refresh instagram`; if that also fails, the
  user must regenerate the token in the Meta app dashboard
  (Instagram → API setup → Generate access tokens) and update `.env`.
- `node social-media-automation/src/cli.ts verify instagram` checks the token without posting.
- Other platforms are added as adapters in `social-media-automation/src/adapters/`.
- Rate limit is 100 API posts per 24h — not a practical concern.
