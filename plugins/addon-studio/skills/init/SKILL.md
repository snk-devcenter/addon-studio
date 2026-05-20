---
name: init
description: Setup inicial do projeto Sankhya Addon Studio para colaboração com o agente. Copia o template `ADDON.md` (instruções do plugin) para a raiz do projeto e garante que o `CLAUDE.md` da raiz importe esse arquivo via `@ADDON.md`. Use quando o dev pedir "setup do projeto", "configurar CLAUDE.md", "instalar instruções do addon-studio", "atualizar ADDON.md", ou rodar `/addon-studio:init`. Operação idempotente — pode ser re-executada para receber atualizações do `ADDON.md` em novas versões do plugin.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Init — Setup do projeto Sankhya para o agente

Skill instala/atualiza no projeto consumidor o `ADDON.md` (instruções do plugin para o agente) e garante que o `CLAUDE.md` da raiz importe esse arquivo via `@ADDON.md`.

## Quando usar

- Primeira vez configurando o projeto pra colaboração com o agente.
- Após atualizar o plugin (`/plugin update addon-studio@snk-devcenter`) — re-rodar pega a versão mais recente do `ADDON.md`.
- Dev pediu "setup", "configurar CLAUDE.md", "instalar instruções", "atualizar ADDON.md".

## Pré-requisito (sanity check)

Antes de copiar nada, confirme que o projeto é mesmo Sankhya Addon Studio. Procure por `br.com.sankhya.addonstudio` em `build.gradle` ou `build.gradle.kts` na raiz. Se ausente, **pare e alerte o dev** — o `ADDON.md` injetaria contexto errado num projeto não-Sankhya.

```bash
grep -l "br.com.sankhya.addonstudio" build.gradle build.gradle.kts 2>/dev/null
```

## Fluxo da skill

### 1. Localizar o `ADDON.md` canônico

O template fica no diretório `assets/` da skill `addon-studio` (convenção Agent Skills). Paths em ambiente real:

- **Claude Code:** `~/.claude/plugins/cache/snk-devcenter/addon-studio/plugins/addon-studio/skills/addon-studio/assets/ADDON.md`
- **Codex CLI:** `~/.codex/marketplaces/addon-studio/plugins/addon-studio/skills/addon-studio/assets/ADDON.md`

Resolva o path concreto a partir do ambiente atual (variáveis de ambiente do harness, ou listagem do diretório de plugins instalados).

### 2. Copiar `ADDON.md` para a raiz do projeto

```bash
cp <plugin-root>/skills/addon-studio/assets/ADDON.md ./ADDON.md
```

Overwrite é **esperado** — re-rodar a skill upgrade o arquivo pra versão mais nova. Dev nunca edita `ADDON.md` à mão (override do projeto vai no `CLAUDE.md`, não aqui).

### 3. Garantir `@ADDON.md` no `CLAUDE.md` da raiz

Claude Code suporta sintaxe de import de arquivo via `@<path>` no `CLAUDE.md`. Garanta que o `CLAUDE.md` da raiz contenha a linha `@ADDON.md`.

**Caso A — `CLAUDE.md` não existe:** crie com o seguinte template mínimo:

````markdown
# CLAUDE.md

@ADDON.md

## Customizações deste projeto

> Regras específicas do projeto que sobrescrevem as skills do plugin (ex.: convenção de pacotes, padrão de nomenclatura customizada, restrições de design adicionais).

- _Sem customizações declaradas._
````

**Caso B — `CLAUDE.md` já existe e já contém `@ADDON.md`:** não faça nada (idempotente).

**Caso C — `CLAUDE.md` já existe mas não contém `@ADDON.md`:** insira a linha `@ADDON.md` no topo (após o título `#`, se houver), preservando o resto do conteúdo intacto. Avise o dev em uma linha que o import foi adicionado.

### 4. Confirmar para o dev

Reporte em 2-3 linhas:

- `ADDON.md` copiado (ou atualizado) para a raiz.
- `CLAUDE.md` criado / import adicionado / já estava OK.
- Próximo passo opcional: dev adiciona regras específicas do projeto na seção "Customizações" do `CLAUDE.md`.

## Idempotência — checklist

- [ ] `ADDON.md` na raiz é overwrite seguro (conteúdo todo gerado pelo plugin).
- [ ] `@ADDON.md` no `CLAUDE.md` só é inserido se ausente — nunca duplica.
- [ ] Não toca em customizações que o dev escreveu no `CLAUDE.md`.

## O que NÃO fazer

- Não regenerar o conteúdo do `ADDON.md` do zero — sempre copie do `assets/`. Fonte de verdade é o plugin.
- Não inserir conteúdo do `ADDON.md` direto no `CLAUDE.md` (era o approach antigo, agora deprecated em favor de `@import`).
- Não criar/symlinkar `AGENTS.md` automaticamente — Codex CLI não suporta `@import`, ainda não há fluxo equivalente. Se o dev pedir explicitamente, oriente copiar o conteúdo de `ADDON.md` para `AGENTS.md` manualmente.

## Related Skills

- `addon-studio` — overview que o `ADDON.md` instrui o agente a carregar
- `encoding` — `ADDON.md` deve ficar em UTF-8 (é arquivo de instrução, não código Sankhya); ignore a regra ISO-8859-1 para este arquivo específico
