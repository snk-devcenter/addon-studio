---
name: encoding
description: Converte e audita encoding de arquivos-fonte Sankhya (`.java`, `.xml`, `.kt`, `.properties`) para ISO-8859-1 via `iconv` ou Python. Use sempre que conteúdo gerado por LLM tiver sido salvo em UTF-8, ao auditar charset de arquivos do projeto, ao revisar arquivos com caracteres acentuados, quando acento aparece trocado/embaralhado no log, no navegador ou na tela (`Ã`, `?`, `PedidoNAo`), quando o build reclama de caractere inválido ou `unmappable character`, ao diagnosticar erros de build/runtime relacionados a charset, ou quando Sankhya exigir Latin-1.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Codificacao de Arquivos — Addon Studio 2.0

> **REGRA CRITICA — SEM EXCECOES**

Todo arquivo `.java`, `.xml`, `.kt` e `.properties` em projetos Addon Studio **deve ser salvo em ISO-8859-1 (Latin-1)**.

---

## Por que ISO-8859-1

O servidor Sankhya (Wildfly legado) e o compilador de addons esperam Latin-1. Arquivo salvo em UTF-8 causa corrupção de acentos e falha silenciosa em runtime.

---

## Regras

| Tipo de arquivo | Regra                                                                                    |
|:----------------|:-----------------------------------------------------------------------------------------|
| `.java` / `.kt` | Salvo em ISO-8859-1. Acentos diretamente no encoding **ou** escapados como `é`, `ç` etc. |
| `.xml` (datadictionary, dbscripts) | Salvo em ISO-8859-1. Cabecalho **obrigatorio**: `<?xml version="1.0" encoding="ISO-8859-1" ?>` |
| `.properties`   | Salvo em ISO-8859-1 (formato historico do Java 8 para properties).                       |

---

## O problema com LLMs

LLMs geram arquivos em UTF-8 por padrao. Apos criar ou editar qualquer `.java`, `.xml`, `.kt` ou `.properties`, **converta o encoding** antes de usar.

> **Antes de converter, cheque o charset atual** (`file -i arquivo.java`). So converta se o resultado for `charset=utf-8`. Arquivo ja em ISO-8859-1 reconvertido de "UTF-8" pode ter acentos corrompidos; e `errors='ignore'`/`errors='replace'` apagam ou trocam caracteres silenciosamente.

### Mac / Linux — `iconv` (nativo, preferido)

Duas guardas são obrigatórias em toda conversão: **charset atual** (só converter UTF-8) e
**ausência de U+FFFD** (ver [Perda silenciosa de acento](#perda-silenciosa-de-acento-ufffd)).
Sem elas a conversão troca acento por `?` sem avisar.

```bash
# Arquivo especifico — NUNCA use o mesmo arquivo como entrada e saida (trunca o arquivo!)
f=arquivo.java
if grep -qF "$(printf '\357\277\275')" "$f"; then
    echo "PERDA: U+FFFD em $f -- restaure via git antes de converter"
else
    case $(file -bi "$f") in *utf-8*)
        t=$(mktemp) && iconv -f UTF-8 -t ISO-8859-1 "$f" > "$t" && cat "$t" > "$f" && rm -f "$t" ;;
    esac
fi

# Todos os .java do projeto (idem para *.xml, *.kt e *.properties)
find . -name "*.java" -exec sh -c '
    grep -qF "$(printf "\357\277\275")" "$1" && { echo "PERDA: U+FFFD em $1"; exit 0; }
    case $(file -bi "$1") in *utf-8*)
        t=$(mktemp) && iconv -f UTF-8 -t ISO-8859-1 "$1" > "$t" && cat "$t" > "$1" && rm -f "$t" ;;
    esac' _ {} \;
```

> `mktemp` em vez de `"$f.tmp"`: o nome fixo sobrescreve arquivo `.tmp` legitimo do
> projeto, e `iconv -o` cria o arquivo mesmo quando a conversao falha. `cat "$t" > "$f"`
> em vez de `mv`: preserva permissoes e inode do original.

### Windows — Python3 (fallback)

`iconv` nao esta disponivel nativamente no Windows. Use Python3 (disponivel em `python.org` ou Microsoft Store):

```python
# Arquivo especifico — so converte se estiver de fato em UTF-8
python3 -c "
import sys
p = sys.argv[1]
c = open(p, 'r', encoding='utf-8').read()
open(p, 'w', encoding='iso-8859-1').write(c)
" arquivo.java
```

```python
# Todos os .java, .xml, .kt e .properties do projeto (rodar na raiz)
python3 -c "
import os, glob
for ext in ('**/*.java', '**/*.xml', '**/*.kt', '**/*.properties'):
    for p in glob.glob(ext, recursive=True):
        try:
            c = open(p, 'r', encoding='utf-8').read()
            open(p, 'w', encoding='iso-8859-1').write(c)
        except (UnicodeDecodeError, UnicodeEncodeError):
            pass  # nao esta em UTF-8 (ja Latin-1) ou tem char sem equivalente — nao tocar
"
```

### Script com deteccao automatica de plataforma

Salve como `scripts/fix-encoding.sh` no projeto para uso rapido:

```bash
#!/bin/sh
# Converte .java, .xml, .kt e .properties para ISO-8859-1
# Usa iconv (Mac/Linux) ou python3 (Windows/fallback)

FILES=$(find . \( -name "*.java" -o -name "*.xml" -o -name "*.kt" -o -name "*.properties" \) -not -path "*/build/*" -not -path "*/.gradle/*")

FFFD=$(printf '\357\277\275')

if command -v iconv > /dev/null 2>&1; then
    echo "$FILES" | while read -r f; do
        # acento ja perdido por leitura UTF-8 de arquivo Latin-1: nao converter
        if grep -qF "$FFFD" "$f"; then
            echo "PERDA: U+FFFD em $f -- restaure via git antes de converter" >&2
            continue
        fi
        # so converte se o arquivo estiver de fato em UTF-8
        case $(file -bi "$f") in *utf-8*)
            t=$(mktemp) && iconv -f UTF-8 -t ISO-8859-1 "$f" > "$t" && cat "$t" > "$f" && rm -f "$t" ;;
        esac
    done
else
    python3 -c "
import sys, os
for p in sys.argv[1:]:
    try:
        c = open(p, 'r', encoding='utf-8').read()
        open(p, 'w', encoding='iso-8859-1').write(c)
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass  # nao esta em UTF-8 ou tem char sem equivalente — nao tocar
" $FILES
fi

echo "Encoding convertido para ISO-8859-1."
```

---

## Verificar encoding de um arquivo

```bash
file -i NomeArquivo.java
# Esperado: charset=iso-8859-1
# Problema: charset=utf-8
```

`file -i` **nao** detecta acento corrompido: arquivo com `?` no lugar de `ê` e
ISO-8859-1 valido e passa o check limpo. Ver a secao seguinte.

---

## Perda silenciosa de acento (U+FFFD)

As tools `Write`/`Edit` do agente nao sao encoding-aware. Ao editar um `.java` que **ja
esta em ISO-8859-1**, o trecho nao tocado e decodificado como UTF-8; um byte solto como
`0xEA` ("ê") nao e sequencia UTF-8 valida e volta gravado como `U+FFFD` (`EF BF BD`).
**O byte original deixa de existir nesse momento** — antes de qualquer conversao.

Converter depois disso nao recupera nada, so mascara:

| Conversao aplicada sobre `U+FFFD`     | Resultado                                  |
|:--------------------------------------|:-------------------------------------------|
| `iconv -t ISO-8859-1//TRANSLIT`       | `?` (0x3F) — perda mascarada, exit 0       |
| `iconv -t ISO-8859-1` (sem TRANSLIT)  | `illegal input sequence`, arquivo fica UTF-8 |
| `iconv -c` / `errors='ignore'`        | caractere omitido — perda igual            |
| `errors='replace'`                    | `?` — perda igual                          |

Nao existe conversao correta nesse estado. O certo e **detectar e restaurar via git**.

### Detectar no projeto todo

```bash
grep -rlF "$(printf '\357\277\275')" \
    --include='*.java' --include='*.xml' --include='*.kt' --include='*.properties' .
```

Qualquer arquivo listado teve acento destruido. Corrija com `git diff` / `git checkout --`
no trecho acentuado e reaplique a edicao — nunca converta o encoding antes disso.

### Evitar

- Editar acento **exige** reescrever o trecho inteiro acentuado no `new_string`, nao
  confiar no conteudo lido.
- Em `.java`/`.kt`, escape Unicode (`\u00ea`) mantem o arquivo ASCII puro e imune ao
  round-trip. Em XML, entidade numerica (`&#234;`) tem o mesmo efeito.
- O hook `PostToolUse` do plugin (`hooks/to-iso88591.sh`) ja barra a conversao e avisa
  quando encontra `U+FFFD`. Rode `sh hooks/to-iso88591.sh --selftest` para conferir.

---

## Cabecalho obrigatorio em XMLs

Todo XML criado ou modificado **deve manter**:

```xml
<?xml version="1.0" encoding="ISO-8859-1" ?>
```

Nunca alterar para `UTF-8` mesmo que editor sugira.

---

## Caracteres especiais em Java/Kotlin

Preferencia: escrever diretamente em Latin-1 apos conversao de encoding.
Alternativa segura (portavel, sem depender de encoding): escapes Unicode.

| Caractere | Escape Unicode |
|:----------|:---------------|
| é         | `\u00e9`   |
| ã         | `\u00e3`   |
| ç         | `\u00e7`   |
| ó         | `\u00f3`   |
| â         | `\u00e2`   |
| ê         | `\u00ea`   |
| ú         | `\u00fa`   |
| à         | `\u00e0`   |

---

## Anti-patterns

| Errado                                              | Correto                                         |
|:----------------------------------------------------|:------------------------------------------------|
| Salvar `.java` / `.xml` em UTF-8                    | Sempre ISO-8859-1                               |
| XML sem cabecalho `encoding="ISO-8859-1"`           | Cabecalho obrigatorio em todo XML               |
| Alterar cabecalho de XML para `encoding="UTF-8"`    | Manter `ISO-8859-1` sem excecao                 |
| Deixar arquivo gerado por LLM sem converter         | Rodar `iconv` (Mac/Linux) ou Python3 (Windows) apos cada criacao/edicao |
| Converter sem checar `file -i` e `U+FFFD`           | Duas guardas antes de todo `iconv` — sem elas o acento vira `?`         |
| `iconv ... -o "$f.tmp" && mv`                       | `mktemp` + `cat "$t" > "$f"` — nome fixo sobrescreve `.tmp` do projeto  |


## Skills relacionadas

- `build` — build falha silenciosamente se encoding estiver errado; garantir Latin-1 antes do empacotamento
