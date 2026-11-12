# Esteira de auditoria de disparo

Mede se cada skill do plugin dispara **sem âncora no projeto** — sem `CLAUDE.md`, sem
`docs/ADDON.md`. O gatilho fica só na `description`; a esteira responde se isso basta.

Roda contra as descriptions **reais** do repo: mexer numa `description` e rodar de novo já
mostra o efeito. Comparação entre runs só é válida se `scenarios.json` não mudou.

## Como rodar

```sh
python3 tools/skill-trigger-audit/audit.py run <rotulo>
```

Roda cada lote em **cada modelo da cadeia** (`haiku`, `sonnet`, `opus`, `fable`) via
`claude -p`, grava `runs/AAAA-MM-DD-<rotulo>.<modelo>.json` e imprime a matriz skill × modelo
com o veredito do gate. Sai com código 1 se o gate falhar ou algum lote não responder.

Cada chamada é cega: recebe só o catálogo (contexto simulado + todas as descriptions + os
sub-agents) e o próprio lote, inline no prompt — sem tools, sem skills carregadas, sem
settings do usuário, e nunca sabe qual skill está sob teste.

- Só alguns modelos: `audit.py run <rotulo> haiku,sonnet`.
- Autenticação é a do `claude` no ambiente. Para usar um launcher, `AUDIT_CLAUDE=/caminho/launcher`.
- `opus` roda cada lote 3 vezes: a 1ª escolha é a mais votada e `conf`/`saliencia` são a
  mediana (as rodadas cruas ficam em `rodadas`). A confiança dele oscila até 10 pontos entre
  rodadas idênticas; nos outros modelos a oscilação medida ficou em 3.
- São 6 × nº de lotes chamadas por rodada, 8 em paralelo.

```sh
python3 tools/skill-trigger-audit/audit.py matrix  runs/2026-11-12-baseline-modelos
python3 tools/skill-trigger-audit/audit.py score   runs/2026-11-12-baseline-modelos.opus.json
python3 tools/skill-trigger-audit/audit.py compare runs/antes.opus.json runs/depois.opus.json
```

`matrix` reimprime a matriz de uma rodada; `score` e `compare` olham um modelo por vez e
precisam de `out/` (`audit.py build`). Os runs ficam versionados — são o histórico da esteira.

Formato do run: por cenário, `skills` (1ª escolha primeiro; `[]` = `NENHUMA`), `conf`
(olhando o catálogo, certeza de que a 1ª escolha é a skill certa), `saliencia` (chance
declarada de parar para consultar o catálogo em vez de responder de memória), `motivo`, `ambiguidade` e `sub_agent`; em `_notas`, o que
o modelo apontou de description que atrapalhou. É por `motivo` e `_notas` que se descobre o que
mexer quando um modelo destoa dos outros.

Só compare runs que têm o campo `saliencia`. Os anteriores foram coletados à mão (um
subagente por lote, um modelo só) ou com `conf` misturando escolha e saliência.

## Desenho

3 cenários por skill, sempre a **primeira** mensagem do dev numa sessão nova:

| eixo | cenário | acerto |
|---|---|---|
| `O` óbvio | cita a anotação/artefato (`@Job`, `AcaoRotinaJava`) | skill é a 1ª escolha |
| `I` indireto | dev-speak de negócio, nenhum termo do SDK | skill é a 1ª escolha |
| `N` negativo | mensagem vizinha que deve cair noutra skill | a skill **não** é a 1ª escolha |

Os lotes embaralham os eixos (`SHUFFLE`/`OFFSETS` em `audit.py`) para o agente não inferir
o padrão do lote, e distribuem as skills de forma que nenhum lote repita skill.

## Critério de aceite

1. `O` e `I` disparam a skill certa em 1ª escolha, **sem** âncora no projeto.
2. `N` não dispara a skill sob teste.
3. Confiança no eixo `I` **≥ 80**. É o número que importa: acerto com conf ≤70 significa que a
   skill foi achada por inferência de domínio, não por termo casado — e inferência é o
   primeiro item a degradar em contexto longo.

Os três itens são **gate em `sonnet`, `opus` e `fable`**. `haiku` roda e aparece na matriz
como `info`: description que só o haiku erra é sinal de gatilho frágil, não bloqueio — inflar
description para o modelo mais fraco piora o catálogo para os outros.

## O que a esteira não mede

Ela pergunta ao agente "você carregaria skill?", o que força uma deliberação que a sessão real
não faz. Logo mede **discriminação** (olhando o catálogo, escolhe certo?), não **saliência**
(para pra olhar?). Saliência não cabe em `description`: depende de instrução always-on —
`docs/ADDON.md` via `/addon-studio:init`, ou o hook `SessionStart` do plugin como piso.

O campo `saliencia` (o `s` da matriz) é o palpite do próprio modelo sobre isso, guardado para
a confiança não carregar esse desconto. Não entra no gate: é autodeclarado numa situação em
que ele já está olhando o catálogo.

Corolário: `O`/`I` em 100% não autoriza remover o `ADDON.md`. Ver `skills/init/assets/ADDON.md`.
