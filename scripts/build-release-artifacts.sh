#!/bin/sh
# Gera os assets anexados a cada GitHub Release.
set -eu

root=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
output_dir=${1:-"$root/dist"}
plugin_root="$root/plugins/addon-studio"

command -v zip > /dev/null 2>&1 || {
    printf '%s\n' 'zip não encontrado no PATH.' >&2
    exit 1
}

mkdir -p "$output_dir"
cp "$root/scripts/install-addon-studio.sh" "$output_dir/addon-studio-install.sh"
cp "$root/scripts/install-addon-studio.ps1" "$output_dir/addon-studio-install.ps1"
tar -czf "$output_dir/addon-studio-codex-agents.tar.gz" -C "$plugin_root" agents/codex
(cd "$plugin_root" && zip -q -r "$output_dir/addon-studio-codex-agents.zip" agents/codex)
