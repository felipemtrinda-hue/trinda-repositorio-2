#!/usr/bin/env bash
# Prepara um vídeo para o site: sem áudio, comprimido, em MP4 (H.264) e WebM (VP9).
#
# Uso:  ferramentas/preparar-video.sh <arquivo-de-entrada> <nome> [largura] [duração]
#   nome:     plantacao | cafeeiro | fruto | grao | xicara
#   largura:  1920 para a faixa "plantacao" (padrão); 960 basta para os cards.
#   duração:  segundos a manter, a partir do início (padrão 12).
#
# Exemplo: ferramentas/preparar-video.sh ~/Downloads/fazenda.mov plantacao
#          ferramentas/preparar-video.sh ~/Downloads/frutos.mp4 fruto 960 8
set -euo pipefail

in="${1:?informe o arquivo de entrada}"
name="${2:?informe o nome (plantacao, cafeeiro, fruto, grao, xicara)}"
width="${3:-1920}"
dur="${4:-12}"
out="$(cd "$(dirname "$0")/.." && pwd)/assets/video"
mkdir -p "$out"

vf="scale='min($width,iw)':-2,fps=30"

ffmpeg -y -loglevel error -i "$in" -t "$dur" -an -vf "$vf" \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart \
  "$out/$name.mp4"

ffmpeg -y -loglevel error -i "$in" -t "$dur" -an -vf "$vf" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 \
  "$out/$name.webm"

ls -lh "$out/$name.mp4" "$out/$name.webm"
