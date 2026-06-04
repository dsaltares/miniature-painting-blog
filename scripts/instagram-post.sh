#!/usr/bin/env bash
# Publish an image post (single or carousel) to Instagram.
#
# Usage:
#   scripts/instagram-post.sh -c "Caption text" IMAGE_URL [IMAGE_URL...]
#   scripts/instagram-post.sh --dry-run -c "Caption" IMAGE_URL
#   scripts/instagram-post.sh --refresh
#
# Requires INSTAGRAM_TOKEN in the environment or in .env at the repo root.
# Image URLs must be public HTTPS JPEGs (e.g. deployed blog images).
# 2-10 images are published as a carousel.
#
# Tokens last 60 days; the script refreshes the token (rewriting .env)
# after every successful publish, or on demand with --refresh.
set -euo pipefail

API="https://graph.instagram.com/v23.0"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY_RUN=0
REFRESH_ONLY=0
CAPTION=""
IMAGES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--caption) CAPTION="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --refresh) REFRESH_ONLY=1; shift ;;
    -h|--help) grep '^#' "$0" | cut -c3-; exit 0 ;;
    *) IMAGES+=("$1"); shift ;;
  esac
done

command -v jq >/dev/null || { echo "error: jq is required" >&2; exit 1; }

# Load token from .env at the repo root if not already set
[[ -z "${INSTAGRAM_TOKEN:-}" && -f "$ROOT/.env" ]] && source "$ROOT/.env"
[[ -n "${INSTAGRAM_TOKEN:-}" ]] || { echo "error: INSTAGRAM_TOKEN not set" >&2; exit 1; }

# Swap the current token for a fresh 60-day one and persist it to .env.
# Refresh can fail legitimately (e.g. token under 24h old), so warn, don't die.
refresh_token() {
  local out new days
  out="$(curl -sf -G "https://graph.instagram.com/refresh_access_token" \
    --data-urlencode "grant_type=ig_refresh_token" \
    --data-urlencode "access_token=$INSTAGRAM_TOKEN")" \
    || { echo "warn: token refresh failed (tokens under 24h old can't be refreshed)" >&2; return 0; }
  new="$(jq -r '.access_token // empty' <<<"$out")"
  [[ -n "$new" ]] || { echo "warn: token refresh returned no token" >&2; return 0; }
  days="$(( $(jq -r '.expires_in' <<<"$out") / 86400 ))"
  if [[ -f "$ROOT/.env" ]] && grep -q '^INSTAGRAM_TOKEN=' "$ROOT/.env"; then
    sed -i '' "s|^INSTAGRAM_TOKEN=.*|INSTAGRAM_TOKEN=$new|" "$ROOT/.env"
    echo "token refreshed (expires in ${days} days), .env updated"
  else
    echo "token refreshed (expires in ${days} days) but .env not found - update INSTAGRAM_TOKEN manually" >&2
  fi
}

if [[ $REFRESH_ONLY -eq 1 ]]; then
  refresh_token
  exit 0
fi

[[ ${#IMAGES[@]} -ge 1 && ${#IMAGES[@]} -le 10 ]] || { echo "error: need 1-10 image URLs" >&2; exit 1; }
[[ -n "$CAPTION" ]] || { echo "error: caption required (-c)" >&2; exit 1; }

api() { # api METHOD PATH [curl args...]
  local method="$1" path="$2"; shift 2
  local out flags=()
  [[ "$method" == "GET" ]] && flags=(-G) || flags=(-X "$method")
  out="$(curl -sf "${flags[@]}" "$API/$path" --data-urlencode "access_token=$INSTAGRAM_TOKEN" "$@")" \
    || { echo "error: API call $method $path failed" >&2; exit 1; }
  if jq -e '.error' <<<"$out" >/dev/null 2>&1; then
    echo "error: $(jq -r '.error.message' <<<"$out")" >&2; exit 1
  fi
  echo "$out"
}

# Preflight: every image URL must be a reachable JPEG
for url in "${IMAGES[@]}"; do
  headers="$(curl -sfI "$url")" || { echo "error: $url is not reachable" >&2; exit 1; }
  grep -qi 'content-type: *image/jpeg' <<<"$headers" \
    || { echo "error: $url is not a JPEG" >&2; exit 1; }
  echo "ok: $url"
done

if [[ $DRY_RUN -eq 1 ]]; then
  echo "dry run: would publish ${#IMAGES[@]} image(s) with caption:"
  echo "$CAPTION"
  exit 0
fi

# Create the media container (single image, or carousel of children)
if [[ ${#IMAGES[@]} -eq 1 ]]; then
  container="$(api POST me/media \
    --data-urlencode "image_url=${IMAGES[0]}" \
    --data-urlencode "caption=$CAPTION" | jq -r '.id')"
else
  children=()
  for url in "${IMAGES[@]}"; do
    child="$(api POST me/media \
      --data-urlencode "image_url=$url" \
      --data-urlencode "is_carousel_item=true" | jq -r '.id')"
    children+=("$child")
    echo "child container: $child"
  done
  container="$(api POST me/media \
    --data-urlencode "media_type=CAROUSEL" \
    --data-urlencode "children=$(IFS=,; echo "${children[*]}")" \
    --data-urlencode "caption=$CAPTION" | jq -r '.id')"
fi
echo "container: $container"

# Wait until the container is ready, then publish
for _ in $(seq 1 30); do
  status="$(api GET "$container?fields=status_code" | jq -r '.status_code')"
  [[ "$status" == "FINISHED" ]] && break
  [[ "$status" == "ERROR" ]] && { echo "error: container processing failed" >&2; exit 1; }
  sleep 2
done
[[ "$status" == "FINISHED" ]] || { echo "error: container not ready after 60s (status: $status)" >&2; exit 1; }

media="$(api POST me/media_publish --data-urlencode "creation_id=$container" | jq -r '.id')"
permalink="$(api GET "$media?fields=permalink" | jq -r '.permalink')"
echo "published: $permalink"

# Keep the token alive: each refresh buys another 60 days
refresh_token
