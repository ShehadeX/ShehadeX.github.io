#!/usr/bin/env bash
# 把 public/img 下的 JPG 压缩为 WebP（最长边 1600px），显著降低首屏体积。
# 生成的 .webp 与原 .jpg 并存，页面用 <picture> 优先加载 webp。
set -e
cd "$(dirname "$0")/.."

SRC="public/img"
MAXW=1600
QUALITY=78

total_before=0
total_after=0

while IFS= read -r f; do
  before=$(stat -f%z "$f")
  total_before=$((total_before + before))
  out="${f%.jpg}.webp"

  # 先按最长边缩放到临时文件，再转 WebP
  tmp=$(mktemp /tmp/pf-img-XXXXXX.jpg)
  sips -Z "$MAXW" "$f" --out "$tmp" >/dev/null 2>&1
  cwebp -quiet -q "$QUALITY" "$tmp" -o "$out"
  rm -f "$tmp"

  after=$(stat -f%z "$out")
  total_after=$((total_after + after))
  printf "%-52s %6sK -> %6sK\n" "$(basename "$f")" "$((before / 1024))" "$((after / 1024))"
done < <(find "$SRC" -name "*.jpg" | sort)

printf "\ntotal: %sK -> %sK  (-%s%%)\n" \
  "$((total_before / 1024))" "$((total_after / 1024))" \
  "$((100 - total_after * 100 / total_before))"
