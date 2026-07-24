#!/bin/sh
# PostToolUse (Write|Edit): converte arquivo-fonte de addon Sankhya para ISO-8859-1.
#
# Lê o payload do hook em stdin (JSON) e converte o arquivo tocado, quando aplicável.
# Rode `sh to-iso88591.sh --selftest` para verificar o comportamento.
#
# Regra central (issue #45): as tools Write/Edit não são encoding-aware. Ao editar um
# arquivo que já está em ISO-8859-1, o trecho não tocado é decodificado como UTF-8;
# um byte solto (ex. 0xEA = "ê") não é UTF-8 válido e é regravado como U+FFFD. O byte
# original deixa de existir ANTES deste hook rodar. Converter nessa situação apenas
# mascara a perda (`//TRANSLIT` transforma U+FFFD em '?'), então aqui o hook aborta e
# avisa em vez de gravar o dado corrompido.
set -u

FFFD=$(printf '\357\277\275')

# Uma conversão de um arquivo. Retorna 2 quando detecta perda de acento.
convert_file() {
    file=$1

    [ -f "$file" ] || return 0

    case "$file" in
        *.java | *.xml | *.kt | *.properties) ;;
        *) return 0 ;;
    esac

    # 1. Perda de dado já ocorrida: nada a converter, o byte original não existe mais.
    #    exit 2 em PostToolUse devolve o stderr para o agente.
    if LC_ALL=C grep -qF "$FFFD" "$file"; then
        printf 'encoding: "%s" contem U+FFFD -- acento perdido ao ler arquivo ISO-8859-1 como UTF-8.\n' "$file" >&2
        printf 'encoding: arquivo NAO convertido. Restaure o trecho acentuado (git diff / git checkout -- "%s") e reaplique a edicao.\n' "$file" >&2
        return 2
    fi

    if command -v iconv > /dev/null 2>&1; then
        # 2. Arquivo que não decodifica como UTF-8 já está em ISO-8859-1 -- nada a fazer.
        #    Reconverter aqui é justamente o que corrompe acento.
        iconv -f UTF-8 -t UTF-8 "$file" > /dev/null 2>&1 || return 0

        # 3. mktemp: "$file.tmp" sobrescreve arquivo .tmp legítimo do projeto (#45).
        tmp=$(mktemp) || return 1
        # ponytail: //TRANSLIT mantido de propósito -- aproxima caractere fora do
        # Latin-1 que o agente pode ter escrito (— vira -). U+FFFD, o caso destrutivo,
        # já foi barrado acima.
        if iconv -f UTF-8 -t 'ISO-8859-1//TRANSLIT' "$file" > "$tmp"; then
            cat "$tmp" > "$file" # preserva permissões/inode (mv traria o 0600 do mktemp)
            rm -f "$tmp"
        else
            rm -f "$tmp"
            printf 'encoding: iconv falhou em "%s" -- arquivo mantido como estava.\n' "$file" >&2
            return 2
        fi
    else
        # Fallback sem iconv (Windows). Decodificação strict: nunca errors='ignore'.
        python3 -c '
import sys
p = sys.argv[1]
raw = open(p, "rb").read()
try:
    txt = raw.decode("utf-8")
except UnicodeDecodeError:
    sys.exit(0)  # ja em ISO-8859-1
open(p, "wb").write(txt.encode("iso-8859-1", errors="replace"))
' "$file" || return 2
    fi

    return 0
}

selftest() {
    dir=$(mktemp -d) || exit 1
    fails=0

    hex() { LC_ALL=C od -An -tx1 "$1" | tr -d ' \n'; }

    check() {
        if [ "$2" = "$3" ]; then
            printf 'ok   %s\n' "$1"
        else
            printf 'FAIL %s: esperado [%s], obtido [%s]\n' "$1" "$2" "$3"
            fails=$((fails + 1))
        fi
    }

    # UTF-8 com acento -> ISO-8859-1: c3a1 vira e1 ("á"), c3aa vira ea ("ê")
    printf 'ol\303\241 \303\252\n' > "$dir/A.java"
    convert_file "$dir/A.java"
    check "utf8 convertido" '6f6ce120ea0a' "$(hex "$dir/A.java")"

    # Já em ISO-8859-1 -> intocado (idempotente; é aqui que o hook antigo gerava '?')
    printf 'ol\341\n' > "$dir/B.java"
    convert_file "$dir/B.java"
    check "latin1 intocado" '6f6ce10a' "$(hex "$dir/B.java")"

    # Com U+FFFD -> aborta com 2 e não grava
    printf 'ol%s\n' "$FFFD" > "$dir/C.java"
    convert_file "$dir/C.java" 2> /dev/null
    check "u+fffd retorna 2" 2 $?
    check "u+fffd nao gravado" '6f6cefbfbd0a' "$(hex "$dir/C.java")"

    # Extensão fora da lista -> intocada
    printf 'ol\303\241\n' > "$dir/D.md"
    convert_file "$dir/D.md"
    check "extensao ignorada" '6f6cc3a10a' "$(hex "$dir/D.md")"

    # Nenhum .tmp adjacente deixado para trás
    check "sem .tmp residual" '' "$(ls "$dir" | grep '\.tmp$' || true)"

    rm -rf "$dir"
    [ "$fails" -eq 0 ] || exit 1
    printf 'selftest ok\n'
}

if [ "${1:-}" = "--selftest" ]; then
    selftest
    exit $?
fi

FILE=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2> /dev/null) || exit 0
[ -n "${FILE:-}" ] || exit 0

convert_file "$FILE"
exit $?
