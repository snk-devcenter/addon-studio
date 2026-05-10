---
name: encoding
description: Converte e audita encoding de arquivos-fonte Sankhya (`.java`, `.xml`, `.kt`, `.properties`) para ISO-8859-1 via `iconv` ou Python. Use sempre que conteúdo gerado por LLM tiver sido salvo em UTF-8, ao auditar charset de arquivos do projeto, ao revisar arquivos com caracteres acentuados, ao diagnosticar erros de build/runtime relacionados a charset, ou quando Sankhya exigir Latin-1.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Codificacao de Arquivos — Addon Studio 2.0

> **REGRA CRITICA — SEM EXCECOES**

Todo arquivo `.java`, `.xml` e `.kt` em projetos Addon Studio **deve ser salvo em ISO-8859-1 (Latin-1)**.

---

## Por que ISO-8859-1

O servidor Sankhya (Wildfly legado) e o compilador de addons esperam Latin-1. Arquivo salvo em UTF-8 causa corrupção de acentos e falha silenciosa em runtime.

---

## Regras

| Tipo de arquivo | Regra                                                                                    |
|:----------------|:-----------------------------------------------------------------------------------------|
| `.java` / `.kt` | Salvo em ISO-8859-1. Acentos diretamente no encoding **ou** escapados como `é`, `ç` etc. |
| `.xml` (datadictionary, dbscripts) | Salvo em ISO-8859-1. Cabecalho **obrigatorio**: `<?xml version="1.0" encoding="ISO-8859-1" ?>` |

---

## O problema com LLMs

LLMs geram arquivos em UTF-8 por padrao. Apos criar ou editar qualquer `.java`, `.xml` ou `.kt`, **converta o encoding** antes de usar.

### Mac / Linux — `iconv` (nativo, preferido)

```bash
# Arquivo especifico
iconv -f UTF-8 -t ISO-8859-1 arquivo.java -o arquivo.java

# Todos os .java do projeto
find . -name "*.java" -exec sh -c 'iconv -f UTF-8 -t ISO-8859-1 "$1" -o "$1.tmp" && mv "$1.tmp" "$1"' _ {} \;

# Todos os .xml do projeto
find . -name "*.xml" -exec sh -c 'iconv -f UTF-8 -t ISO-8859-1 "$1" -o "$1.tmp" && mv "$1.tmp" "$1"' _ {} \;
```

> **Dica:** se o arquivo ja esta em ISO-8859-1 puro (sem chars fora da faixa Latin-1), `iconv` finaliza sem erro. Seguro rodar mesmo sem necessidade.

### Windows — Python3 (fallback)

`iconv` nao esta disponivel nativamente no Windows. Use Python3 (disponivel em `python.org` ou Microsoft Store):

```python
# Arquivo especifico
python3 -c "
import sys
p = sys.argv[1]
c = open(p, 'r', encoding='utf-8', errors='ignore').read()
open(p, 'w', encoding='iso-8859-1', errors='replace').write(c)
" arquivo.java
```

```python
# Todos os .java e .xml do projeto (rodar na raiz)
python3 -c "
import os, glob
for ext in ('**/*.java', '**/*.xml', '**/*.kt'):
    for p in glob.glob(ext, recursive=True):
        try:
            c = open(p, 'r', encoding='utf-8').read()
            open(p, 'w', encoding='iso-8859-1', errors='replace').write(c)
        except (UnicodeDecodeError, UnicodeEncodeError):
            pass
"
```

### Script com deteccao automatica de plataforma

Salve como `scripts/fix-encoding.sh` no projeto para uso rapido:

```bash
#!/bin/sh
# Converte .java, .xml e .kt para ISO-8859-1
# Usa iconv (Mac/Linux) ou python3 (Windows/fallback)

FILES=$(find . \( -name "*.java" -o -name "*.xml" -o -name "*.kt" \) -not -path "*/build/*" -not -path "*/.gradle/*")

if command -v iconv > /dev/null 2>&1; then
    echo "$FILES" | while read -r f; do
        iconv -f UTF-8 -t ISO-8859-1 "$f" -o "$f.tmp" && mv "$f.tmp" "$f"
    done
else
    python3 -c "
import sys, os
for p in sys.argv[1:]:
    try:
        c = open(p, 'r', encoding='utf-8').read()
        open(p, 'w', encoding='iso-8859-1', errors='replace').write(c)
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass
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
| é         | `é`       |
| ã         | `ã`       |
| ç         | `ç`       |
| ó         | `ó`       |
| â         | `â`       |
| ê         | `ê`       |
| ú         | `ú`       |
| à         | `à`       |

---

## Anti-patterns

| Errado                                              | Correto                                         |
|:----------------------------------------------------|:------------------------------------------------|
| Salvar `.java` / `.xml` em UTF-8                    | Sempre ISO-8859-1                               |
| XML sem cabecalho `encoding="ISO-8859-1"`           | Cabecalho obrigatorio em todo XML               |
| Alterar cabecalho de XML para `encoding="UTF-8"`    | Manter `ISO-8859-1` sem excecao                 |
| Deixar arquivo gerado por LLM sem converter         | Rodar `iconv` (Mac/Linux) ou Python3 (Windows) apos cada criacao/edicao |


## Related Skills

- `addon-studio` — regra universal: ISO-8859-1 obrigatório em `.java`/`.xml`/`.kt`
- `build` — build falha silenciosamente se encoding estiver errado
