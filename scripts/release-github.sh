#!/bin/bash
# 사용법: release-github.sh [TAG] [--from-step N]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TAG_ARG=""
FROM_STEP=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-step) FROM_STEP="${2:?--from-step requires a number}"; shift 2 ;;
    *) TAG_ARG="$1"; shift ;;
  esac
done

APP_VERSION="$(node -p "require('./package.json').version")"
TAG="${TAG_ARG:-v${APP_VERSION}}"
NOTARY_TIMEOUT="${NOTARY_TIMEOUT:-30m}"

[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]] \
  || { echo "[release] invalid tag format: $TAG (expected vX.Y.Z...)"; exit 1; }
[[ "$APP_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9] ]] \
  || { echo "[release] unexpected version format: $APP_VERSION"; exit 1; }

for cmd in npm gh xcrun git node python3; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "[release] missing command: $cmd"; exit 1; }
done

: "${APPLE_API_KEY:?missing env: APPLE_API_KEY}"
: "${APPLE_API_KEY_ID:?missing env: APPLE_API_KEY_ID}"
: "${APPLE_API_ISSUER:?missing env: APPLE_API_ISSUER}"

[ -f "$APPLE_API_KEY" ] && [ -r "$APPLE_API_KEY" ] \
  || { echo "[release] APPLE_API_KEY must be a readable .p8 file path: $APPLE_API_KEY"; exit 1; }

echo "[release] version=${APP_VERSION}, tag=${TAG}${FROM_STEP:+, from-step=${FROM_STEP}}"

if [[ "$FROM_STEP" -le 1 ]]; then
  echo "[release] 0/6 clean previous artifacts"
  rm -rf release/

  echo "[release] 1/6 build package"
  npm run package
fi

ZIP_PATH="$(find release -maxdepth 1 -type f -name "*-${APP_VERSION}-arm64-mac.zip" -print -quit)"
APP_PATH="$(find release/mac-arm64 -maxdepth 1 -type d -name "*.app" -print -quit 2>/dev/null || true)"
[ -n "$ZIP_PATH" ] && [ -f "$ZIP_PATH" ] || { echo "[release] zip artifact not found"; exit 1; }
[ -n "$APP_PATH" ] && [ -d "$APP_PATH" ] || { echo "[release] app bundle not found"; exit 1; }

if [[ "$FROM_STEP" -le 2 ]]; then
  echo "[release] 2/6 notarization submit"
  SUBMIT_JSON="$(xcrun notarytool submit "$ZIP_PATH" \
    --key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER" \
    --no-wait --output-format json)"
  SUBMISSION_ID="$(printf '%s' "$SUBMIT_JSON" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')" \
    || { echo "[release] failed to parse submission id"; echo "$SUBMIT_JSON"; exit 1; }
  [ -n "$SUBMISSION_ID" ] || { echo "[release] empty submission id"; echo "$SUBMIT_JSON"; exit 1; }
  echo "[release] submission id: $SUBMISSION_ID"
fi

if [[ "$FROM_STEP" -le 3 ]]; then
  echo "[release] 3/6 notarization wait (timeout=${NOTARY_TIMEOUT})"
  if ! xcrun notarytool wait "${SUBMISSION_ID:?missing SUBMISSION_ID — cannot skip step 2}" \
    --key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER" \
    --timeout "$NOTARY_TIMEOUT"; then
    NOTARY_STATUS="$(xcrun notarytool info "$SUBMISSION_ID" \
      --key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER" \
      --output-format json 2>/dev/null \
      | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status","unknown"))' \
      || echo "unknown")"
    if [[ "$NOTARY_STATUS" == "Invalid" ]]; then
      echo "[release] notarization REJECTED by Apple"
      xcrun notarytool log "$SUBMISSION_ID" \
        --key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER" || true
    else
      echo "[release] notarization timed out (status=${NOTARY_STATUS}), submission still pending"
      echo "[release] re-run: xcrun notarytool wait $SUBMISSION_ID --key \$APPLE_API_KEY --key-id \$APPLE_API_KEY_ID --issuer \$APPLE_API_ISSUER"
    fi
    exit 1
  fi

  NOTARY_STATUS="$(xcrun notarytool info "$SUBMISSION_ID" \
    --key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER" \
    --output-format json \
    | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status","unknown"))')"
  if [[ "$NOTARY_STATUS" != "Accepted" ]]; then
    echo "[release] notarization not accepted: status=${NOTARY_STATUS}"
    xcrun notarytool log "$SUBMISSION_ID" \
      --key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER" || true
    exit 1
  fi
fi

if [[ "$FROM_STEP" -le 4 ]]; then
  echo "[release] 4/6 staple + validate"
  xcrun stapler staple "$APP_PATH"
  xcrun stapler validate "$APP_PATH"

  echo "[release] re-creating zip from stapled .app"
  APP_NAME="$(basename "$APP_PATH")"
  APP_PARENT="$(dirname "$APP_PATH")"
  (cd "$APP_PARENT" && zip -r --symlinks "$OLDPWD/$ZIP_PATH" "$APP_NAME")
  echo "[release] zip recreated: $ZIP_PATH"
fi

ASSETS=()
while IFS= read -r -d '' file; do ASSETS+=("$file"); done < <(
  find release -maxdepth 1 -type f \( \
    -name "*-${APP_VERSION}-arm64.dmg" -o \
    -name "*-${APP_VERSION}-arm64-mac.zip" -o \
    -name "*-${APP_VERSION}-arm64*.blockmap" -o \
    -name "latest-mac.yml" \
  \) -print0
)
[ "${#ASSETS[@]}" -gt 0 ] || { echo "[release] no release assets found"; exit 1; }

if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "[release] create local tag: $TAG"
  git tag "$TAG"
fi
if ! git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "[release] push tag: $TAG"
  git push origin "$TAG"
fi

echo "[release] 5/6 create/upload github release"
if gh release view "$TAG" >/dev/null 2>&1; then
  gh release upload "$TAG" "${ASSETS[@]}" --clobber
else
  gh release create "$TAG" "${ASSETS[@]}" --generate-notes
fi

echo "[release] 6/6 done"
echo "[release] tag=$TAG"
