---
name: init
description: Setup do projeto Sankhya Addon Studio para colaboração com o agente. Copia o template `ADDON.md` (instruções do plugin) para `docs/ADDON.md` no projeto e garante que o `CLAUDE.md` da raiz importe esse arquivo via `@docs/ADDON.md`. Use quando o dev pedir "setup do projeto", "configurar CLAUDE.md", "instalar instruções do addon-studio", "atualizar ADDON.md", "preparar esse projeto recém-clonado", ou rodar `/addon-studio:init`. Operação idempotente — pode ser re-executada para receber atualizações do `ADDON.md` em novas versões do plugin. Não é o `/init` embutido do Claude Code (que documenta um codebase qualquer) e não cria projeto nem `build.gradle` do zero: só instala as instruções do agente num projeto que já existe.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Init — Setup do projeto Sankhya para o agente

Skill instala/atualiza no projeto consumidor o `docs/ADDON.md` (instruções do plugin para o agente) e garante que o `CLAUDE.md` da raiz importe esse arquivo via `@docs/ADDON.md`.

## Quando usar

- Primeira vez configurando o projeto pra colaboração com o agente.
- Após atualizar o plugin (`/plugin update addon-studio`) — re-rodar pega a versão mais recente do `ADDON.md`.
- Dev pediu "setup", "configurar CLAUDE.md", "instalar instruções", "atualizar ADDON.md".

## Pré-requisito (sanity check)

Antes de copiar nada, confirme que o projeto é mesmo Sankhya Addon Studio. Procure por `br.com.sankhya.addonstudio` em `build.gradle` ou `build.gradle.kts` na raiz. Se ausente, **pare e alerte o dev** — o `ADDON.md` injetaria contexto errado num projeto não-Sankhya.

```bash
grep -l "br.com.sankhya.addonstudio" build.gradle build.gradle.kts 2>/dev/null
```

## Fluxo da skill

### 1. Localizar o `ADDON.md` canônico

O template fica no diretório `assets/` desta skill (convenção Agent Skills). Use a variável de ambiente `${CLAUDE_PLUGIN_ROOT}` (disponível para skills de plugin — aponta para a raiz do plugin instalado):

- `${CLAUDE_PLUGIN_ROOT}/skills/init/assets/ADDON.md`

### 2. Copiar `ADDON.md` para `docs/` no projeto

```bash
mkdir -p docs
cp "${CLAUDE_PLUGIN_ROOT}/skills/init/assets/ADDON.md" ./docs/ADDON.md
```

Overwrite é **esperado** — re-rodar a skill upgrade o arquivo pra versão mais nova. Dev nunca edita `docs/ADDON.md` à mão (override do projeto vai no `CLAUDE.md`, não aqui).

### 3. Garantir `@docs/ADDON.md` no `CLAUDE.md` da raiz

Claude Code suporta sintaxe de import de arquivo via `@<path>` no `CLAUDE.md`. Garanta que o `CLAUDE.md` da raiz contenha a linha `@docs/ADDON.md`.

**Caso A — `CLAUDE.md` não existe:** crie o arquivo com uma linha só, o import:

````markdown
@docs/ADDON.md
````

Nada além disso — sem título, sem seção de customizações, sem placeholder. Regra específica do projeto entra depois, quando o dev pedir; seção vazia com placeholder vira convite pro agente preencher e duplicar o que já está documentado em outro lugar do repo.

**Caso B — `CLAUDE.md` já existe e já contém `@docs/ADDON.md`:** não faça nada (idempotente).

**Caso C — `CLAUDE.md` já existe mas não contém `@docs/ADDON.md`:** insira a linha `@docs/ADDON.md` no topo (após o título `#`, se houver), preservando o resto do conteúdo intacto. Só a linha do import — não acrescente seção nenhuma. Avise o dev em uma linha que o import foi adicionado.

### 4. Confirmar para o dev

Reporte em 2-3 linhas:

- `docs/ADDON.md` copiado (ou atualizado).
- `CLAUDE.md` criado / import adicionado / já estava OK.

Não sugira conteúdo pro `CLAUDE.md` nem ofereça preencher regras do projeto — o dev escreve isso quando precisar.

## Idempotência — checklist

- [ ] `docs/ADDON.md` é overwrite seguro (conteúdo todo gerado pelo plugin).
- [ ] `@docs/ADDON.md` no `CLAUDE.md` só é inserido se ausente — nunca duplica.
- [ ] Não toca no conteúdo que o dev escreveu no `CLAUDE.md`.
- [ ] Não escreve regra de projeto no `CLAUDE.md` — a skill só garante o import.

## O que NÃO fazer

- Não regenerar o conteúdo do `ADDON.md` do zero — sempre copie do `assets/`. Fonte de verdade é o plugin.
- Não inserir conteúdo do `ADDON.md` direto no `CLAUDE.md` (era o approach antigo, agora deprecated em favor de `@import`).

## Skills relacionadas

- `encoding` — `ADDON.md` deve ficar em UTF-8 (é arquivo de instrução, não código Sankhya); ignore a regra ISO-8859-1 para este arquivo específico
