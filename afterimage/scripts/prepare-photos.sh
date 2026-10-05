#!/usr/bin/env sh
# Usage: scripts/prepare-photos.sh <source-image> <slot>
# Slots: hero presence persona frame1..frame5 fashion final
# Resizes to a 2200px long edge, strips metadata and writes public/photos/<slot>.jpg.
set -eu
src="$1"; slot="$2"
convert "$src" -auto-orient -strip -resize '2200x2200>' -sampling-factor 4:2:0 -interlace JPEG -quality 84 "public/photos/$slot.jpg"
echo "public/photos/$slot.jpg"
