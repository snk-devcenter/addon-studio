#!/bin/sh
# Artefato de release: instala o plugin para Claude Code ou Codex CLI.
set -eu

asset_base=${ADDON_STUDIO_ASSET_BASE:-https://github.com/snk-devcenter/addon-studio/releases/latest/download}
provider=
provider_count=0
force=0

usage() {
    printf '%s\n' 'Uso: install-addon-studio.sh --claude|--codex [--force]'
}

for argument in "$@"; do
    case "$argument" in
        --claude) provider=claude; provider_count=$((provider_count + 1)) ;;
        --codex) provider=codex; provider_count=$((provider_count + 1)) ;;
        --force) force=1 ;;
        *) usage; exit 2 ;;
    esac
done

[ "$provider_count" -eq 1 ] || {
    usage
    exit 2
}

install_claude() {
    command -v claude > /dev/null 2>&1 || {
        printf '%s\n' 'Claude Code não encontrado no PATH.' >&2
        exit 1
    }

    if ! claude plugin marketplace update snk-devcenter; then
        claude plugin marketplace add snk-devcenter/addon-studio --scope user || {
            printf '%s\n' 'Não foi possível configurar o marketplace snk-devcenter no Claude Code.' >&2
            exit 1
        }
    fi
    if ! claude plugin update addon-studio@snk-devcenter --scope user -y; then
        claude plugin install addon-studio@snk-devcenter --scope user -y || {
            printf '%s\n' 'Não foi possível instalar o plugin addon-studio no Claude Code.' >&2
            exit 1
        }
    fi
    printf '%s\n' 'Claude Code pronto. Reinicie a sessão para carregar o plugin e os agents.'
}

install_codex_agents() {
    command -v curl > /dev/null 2>&1 || {
        printf '%s\n' 'curl não encontrado no PATH.' >&2
        exit 1
    }
    command -v tar > /dev/null 2>&1 || {
        printf '%s\n' 'tar não encontrado no PATH.' >&2
        exit 1
    }

    temp_dir=$(mktemp -d) || exit 1
    trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM
    curl -fsSL "$asset_base/addon-studio-codex-agents.tar.gz" -o "$temp_dir/agents.tar.gz"
    tar -xzf "$temp_dir/agents.tar.gz" -C "$temp_dir"

    if [ -n "${CODEX_HOME:-}" ]; then
        codex_root=$CODEX_HOME
    elif [ -n "${HOME:-}" ]; then
        codex_root="$HOME/.codex"
    else
        printf '%s\n' 'CODEX_HOME ou HOME não está definido.' >&2
        exit 1
    fi

    source_dir="$temp_dir/agents/codex"
    target_dir="$codex_root/agents"
    [ -d "$source_dir" ] || {
        printf '%s\n' 'Artefato de agents inválido.' >&2
        exit 1
    }
    mkdir -p "$target_dir"

    installed=0
    current=0
    preserved=0
    for source in "$source_dir"/*.toml; do
        [ -f "$source" ] || continue
        target="$target_dir/${source##*/}"
        if [ -f "$target" ]; then
            if cmp -s "$source" "$target"; then
                current=$((current + 1))
                continue
            fi
            if [ "$force" -eq 0 ]; then
                preserved=$((preserved + 1))
                printf 'Preservado: %s (use --force para substituir).\n' "$target"
                continue
            fi
        fi
        cp "$source" "$target"
        installed=$((installed + 1))
    done
    printf 'Agents instalados/atualizados: %s; já atuais: %s; preservados: %s.\n' \
        "$installed" "$current" "$preserved"
}

install_codex() {
    command -v codex > /dev/null 2>&1 || {
        printf '%s\n' 'Codex CLI não encontrado no PATH.' >&2
        exit 1
    }

    if ! codex plugin marketplace upgrade snk-devcenter; then
        codex plugin marketplace add snk-devcenter/addon-studio --ref main || {
            printf '%s\n' 'Não foi possível configurar o marketplace snk-devcenter no Codex.' >&2
            exit 1
        }
    fi
    codex plugin add addon-studio@snk-devcenter || {
        printf '%s\n' 'Não foi possível instalar o plugin addon-studio no Codex.' >&2
        exit 1
    }
    install_codex_agents
    printf '%s\n' 'Codex pronto. Abra uma nova sessão para carregar o plugin e os agents.'
}

case "$provider" in
    claude) install_claude ;;
    codex) install_codex ;;
esac
