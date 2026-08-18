#!/bin/sh
# Checagem mínima dos instaladores e pacotes de release.
set -eu

root=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT HUP INT TERM

sh -n "$root/scripts/install-addon-studio.sh"
! sh "$root/scripts/install-addon-studio.sh" > /dev/null 2>&1
! sh "$root/scripts/install-addon-studio.sh" --claude --codex > /dev/null 2>&1
sh "$root/scripts/build-release-artifacts.sh" "$test_dir"
[ -f "$test_dir/addon-studio-install.ps1" ]
[ "$(tar -tzf "$test_dir/addon-studio-codex-agents.tar.gz" | grep -c '\.toml$')" -eq 6 ]
[ "$(unzip -Z1 "$test_dir/addon-studio-codex-agents.zip" | grep -c '\.toml$')" -eq 6 ]

if command -v pwsh > /dev/null 2>&1; then
    pwsh -NoProfile -Command "[scriptblock]::Create([IO.File]::ReadAllText('$root/scripts/install-addon-studio.ps1')) | Out-Null"
fi

printf '%s\n' 'release artifacts ok'
