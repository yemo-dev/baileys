#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROTO_FILE="$ROOT_DIR/protos/WhisperTextProtocol.proto"
OUT_FILE="$ROOT_DIR/src/WhisperTextProtocol.js"

if [ ! -f "$PROTO_FILE" ]; then
  echo "Proto file not found: $PROTO_FILE" >&2
  exit 1
fi

if [ ! -x "$ROOT_DIR/../../../node_modules/.bin/pbjs" ]; then
  echo "pbjs not found at $ROOT_DIR/../../../node_modules/.bin/pbjs" >&2
  echo "Install dependencies first (yarn install)." >&2
  exit 1
fi

"$ROOT_DIR/../../../node_modules/.bin/pbjs" \
  -t static-module \
  -w commonjs \
  -o "$OUT_FILE" \
  "$PROTO_FILE"

echo "Generated: $OUT_FILE"
