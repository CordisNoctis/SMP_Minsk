#!/usr/bin/env bash
# ============================================================
# Автосборка офлайн-кэша для SMP Minsk.
# Запускается GitHub Action'ом после каждой публикации (push),
# можно запускать и вручную локально (Git Bash).
#
# Что делает:
#   1) собирает список всех файлов приложения (html/css/js/json/картинки и т.д.);
#   2) считает хэш сборки SW_BUILD по именам и содержимому этих файлов;
#   3) записывает список и хэш в sw.js между маркерами
#      ===@smp-build-start=== / ===@smp-build-end===.
#
# Любое изменение любого файла проекта меняет хэш → у всех
# пользователей приложение обновляется целиком.
# ============================================================
set -euo pipefail

# Корень репозитория (скрипт лежит в .github/scripts/)
cd "$(dirname "$0")/../.."

SW_FILE="sw.js"

if [ ! -f "$SW_FILE" ]; then
  echo "ОШИБКА: не найден $SW_FILE (скрипт должен лежать в .github/scripts/)" >&2
  exit 1
fi

if ! grep -q "// ===@smp-build-start===" "$SW_FILE" || ! grep -q "// ===@smp-build-end===" "$SW_FILE"; then
  echo "ОШИБКА: в sw.js нет маркеров ===@smp-build-start=== / ===@smp-build-end===" >&2
  exit 1
fi

# Защита: файл закоммичен с маркерами конфликта слияния (после pull/sync)
if grep -qE "^(<{7}|={7}|>{7})" "$SW_FILE"; then
  echo "ОШИБКА: в sw.js остались маркеры конфликта слияния (<<<<<<< / ======= / >>>>>>>)." >&2
  echo "Откройте sw.js в VS Code, выделите всё (Ctrl+A) и вставьте чистую версию файла целиком, затем закоммитьте." >&2
  exit 1
fi

# --- 1. Список файлов приложения ---
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ALL_FILES=$(git ls-files)
else
  ALL_FILES=$(find . -type f -not -path "./.git/*" | sed "s|^\./||")
fi

FILES=$(
  printf "%s\n" "$ALL_FILES" |
  grep -E "\.(html|css|js|json|webmanifest|md|png|svg|ico|jpg|jpeg|gif|webp|avif|woff2?|ttf)$" |
  grep -v -E "^(\.github/|sw\.js$|README)" |
  sort
)

if [ -z "$FILES" ]; then
  echo "ОШИБКА: список файлов пуст — что-то пошло не так" >&2
  exit 1
fi

# --- 2. Хэш сборки: по именам и содержимому всех файлов списка ---
BUILD=$(
  {
    printf "%s\n" "$FILES" | sed "s|^|./|"
    while IFS= read -r f; do
      cat "$f"
      printf "\n"
    done <<< "$FILES"
  } | sha1sum | head -c 10
)

# --- 3. Генерируем блок и вставляем его в sw.js между маркерами ---
BLOCK_FILE=$(mktemp)
{
  echo "// ===@smp-build-start==="
  echo "// ВНИМАНИЕ: этот блок создаётся автоматически (GitHub Action / .github/scripts/sw-build.sh)."
  echo "// Не редактировать вручную — изменения будут перезаписаны при следующей публикации."
  echo "const SW_BUILD = \"$BUILD\";"
  echo -n "const PRECACHE_LIST = ["
  while IFS= read -r f; do
    printf "\n  \"./%s\"," "$f"
  done <<< "$FILES"
  echo ""
  echo "];"
  echo "// ===@smp-build-end==="
} > "$BLOCK_FILE"

# Заменяем содержимое между маркерами (учитываем возможные CRLF-концы строк)
awk -v block="$BLOCK_FILE" '
  { sub(/\r$/, "") }
  /^\/\/ ===@smp-build-start===/ { while ((getline line < block) > 0) print line; inblock = 1; next }
  /^\/\/ ===@smp-build-end===/   { inblock = 0; next }
  !inblock { print }
' "$SW_FILE" > "$SW_FILE.tmp" && mv "$SW_FILE.tmp" "$SW_FILE"

# --- 4. Проверки, что sw.js не повреждён ---
grep -q "SW_BUILD = \"$BUILD\"" "$SW_FILE" || {
  echo "ОШИБКА: не удалось вставить блок в sw.js" >&2
  exit 1
}
grep -q "// ===@smp-build-end===" "$SW_FILE" || {
  echo "ОШИБКА: пропал закрывающий маркер в sw.js" >&2
  exit 1
}
if command -v node >/dev/null 2>&1; then
  node --check "$SW_FILE" || { echo "ОШИБКА: синтаксис sw.js повреждён" >&2; exit 1; }
fi

FILE_COUNT=$(printf "%s\n" "$FILES" | grep -c .)
echo "Готово: SW_BUILD = $BUILD, файлов в офлайн-кэше: $FILE_COUNT"