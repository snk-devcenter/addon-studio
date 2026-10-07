#!/bin/sh
# SessionStart: injeta as regras sempre-ativas do plugin em projeto Sankhya Addon Studio.
#
# Piso para projeto que nunca rodou `/addon-studio:init`: sem isso, as regras universais
# (Java 8 estrito, ISO-8859-1, JAPE, Guice) nao entram no contexto por caminho nenhum.
# Resultado medido pela esteira em tools/skill-trigger-audit: a skill focada dispara, mas
# o codigo sai fora da regra.
#
# Fonte unica: o mesmo ADDON.md que o `init` copia. Nada e duplicado aqui.
# Rode `sh session-context.sh --selftest` para verificar.
set -u

ADDON_MD="${CLAUDE_PLUGIN_ROOT:-$(dirname "$0")/..}/skills/init/assets/ADDON.md"

# Imprime o diretorio, a partir de $1 subindo, cujo build.gradle aplica o plugin Gradle --
# o unico sinal confiavel de projeto Addon Studio. O modulo -vc nao aplica, a raiz sim:
# mesma regra do isInAddonProject em commons.ts.
addon_root() {
    dir=$1
    while :; do
        for f in "$dir/build.gradle" "$dir/build.gradle.kts"; do
            [ -f "$f" ] || continue
            if grep -q 'br\.com\.sankhya\.addonstudio' "$f" 2> /dev/null; then
                printf '%s' "$dir"
                return 0
            fi
        done
        parent=$(dirname "$dir")
        [ "$parent" != "$dir" ] || return 1
        dir=$parent
    done
}

# cwd vem no payload JSON do hook (stdin). Sem python3 nao ha como serializar a saida
# com seguranca -- fica silencioso em vez de emitir JSON quebrado.
emit() {
    [ -f "$ADDON_MD" ] || return 0
    command -v python3 > /dev/null 2>&1 || return 0
    root=$(addon_root "$1") || return 0

    # Ja rodou o init: o ADDON.md do projeto ja esta no contexto via CLAUDE.md, que o Claude
    # Code carrega tambem dos diretorios acima do cwd. Nao repetir.
    if [ -f "$root/docs/ADDON.md" ] && [ -f "$root/CLAUDE.md" ] &&
        grep -q '@docs/ADDON\.md' "$root/CLAUDE.md" 2> /dev/null; then
        return 0
    fi

    ADDON_MD="$ADDON_MD" python3 -c '
import json, os, sys
body = open(os.environ["ADDON_MD"], encoding="utf-8").read()
nota = ("[Injetado pelo plugin addon-studio: este projeto nao tem docs/ADDON.md. "
        "Rode /addon-studio:init para fixar estas regras no projeto.]\n\n")
json.dump({"hookSpecificOutput": {"hookEventName": "SessionStart",
                                  "additionalContext": nota + body}}, sys.stdout)
'
}

if [ "${1:-}" = "--selftest" ]; then
    tmp=$(mktemp -d) || exit 1
    trap 'rm -rf "$tmp"' EXIT
    fail=0
    check() { # nome, esperado(vazio|json), cwd
        out=$(emit "$3")
        if [ "$2" = "vazio" ] && [ -n "$out" ]; then echo "FALHA $1: esperava silencio"; fail=1
        elif [ "$2" = "json" ] && ! printf '%s' "$out" | grep -q additionalContext; then
            echo "FALHA $1: esperava additionalContext"; fail=1
        else echo "ok $1"; fi
    }
    check "projeto sem build.gradle" vazio "$tmp"
    mkdir -p "$tmp/outro" && echo "plugins { id 'java' }" > "$tmp/outro/build.gradle"
    check "build.gradle de outro stack" vazio "$tmp/outro"
    mkdir -p "$tmp/addon" && echo "plugins { id 'br.com.sankhya.addonstudio' }" > "$tmp/addon/build.gradle"
    check "projeto addon sem init" json "$tmp/addon"
    mkdir -p "$tmp/addon/addon-vc" && echo "plugins { id 'java' }" > "$tmp/addon/addon-vc/build.gradle"
    check "sessao no modulo -vc de addon sem init" json "$tmp/addon/addon-vc"
    mkdir -p "$tmp/addon/docs" && : > "$tmp/addon/docs/ADDON.md"
    echo '@docs/ADDON.md' > "$tmp/addon/CLAUDE.md"
    check "projeto addon com init" vazio "$tmp/addon"
    check "sessao no modulo -vc de addon com init" vazio "$tmp/addon/addon-vc"
    exit $fail
fi

payload=$(cat)
cwd=$(printf '%s' "$payload" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
[ -n "$cwd" ] || cwd=$PWD
emit "$cwd"
exit 0
