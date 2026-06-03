# Miniature Painting Blog

Personal miniature painting/wargaming blog. Hugo + Blowfish theme (git submodule at `themes/blowfish`), deployed to GitHub Pages via GitHub Actions.

## Conventions

- Use conventional commits (`feat:`, `fix:`, `chore:`, `content:` for posts).
- Config lives in `config/_default/` (not a root `hugo.toml`).
- Posts are page bundles: `content/posts/<slug>/index.md` with images alongside.
- Custom colour scheme: `assets/css/schemes/parchment.css`.

## Commands

- `hugo server` — local preview
- `hugo --gc` — production build
- `git submodule update --remote --merge` — update theme
