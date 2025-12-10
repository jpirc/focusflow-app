#!/usr/bin/env bash
set -euo pipefail

# Copy .env.example -> .env for local development and generate secrets.
# Safe to run locally; the script will not commit the .env file.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE_FILE="$ROOT/.env.example"
TARGET_FILE="$ROOT/.env"

if [ -f "$TARGET_FILE" ]; then
  echo "Local .env already exists at $TARGET_FILE — leaving it untouched."
  exit 0
fi

if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "No .env.example found at $EXAMPLE_FILE"
  exit 1
fi

cp "$EXAMPLE_FILE" "$TARGET_FILE"

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32
  else
    python3 - <<'PY'
import os,base64
print(base64.b64encode(os.urandom(24)).decode())
PY
  fi
}

JWT_SECRET_VAL=$(generate_secret)
NEXTAUTH_SECRET_VAL=$(generate_secret)

# Replace simple placeholders if present
if grep -q "REPLACE_WITH_SECURE_RANDOM_SECRET" "$TARGET_FILE" 2>/dev/null; then
  sed -i "s/REPLACE_WITH_SECURE_RANDOM_SECRET/$JWT_SECRET_VAL/g" "$TARGET_FILE" || sed -i "" "s/REPLACE_WITH_SECURE_RANDOM_SECRET/$JWT_SECRET_VAL/g" "$TARGET_FILE" || true
fi
if grep -q "REPLACE_WITH_SECURE_RANDOM" "$TARGET_FILE" 2>/dev/null; then
  sed -i "s/REPLACE_WITH_SECURE_RANDOM/$NEXTAUTH_SECRET_VAL/g" "$TARGET_FILE" || sed -i "" "s/REPLACE_WITH_SECURE_RANDOM/$NEXTAUTH_SECRET_VAL/g" "$TARGET_FILE" || true
fi

echo "Created $TARGET_FILE with generated secrets for local development."
echo "Edit $TARGET_FILE to set your DATABASE_URL and ANTHROPIC_API_KEY before running the app."

exit 0
