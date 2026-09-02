# Esteira de auditoria de disparo

Mede se cada skill do plugin dispara **sem âncora no projeto** — sem `CLAUDE.md`, sem
`docs/ADDON.md`. O gatilho fica só na `description`; a esteira responde se isso basta.

Roda contra as descriptions **reais** do repo: mexer numa `description` e rodar de novo já
mostra o efeito. Comparação entre runs só é válida se `scenarios.json` não mudou.

## Como rodar

```sh
python3 tools/skill-trigger-audit/audit.py build
```

Gera `out/` (não versionado): `catalog.md` (contexto simulado + as 24 descriptions + os
sub-agents), `batch-1..12.md`, `key.json` (gabarito) e `prompt.md`.

Depois, **um subagente por lote** — 12 no total, `general-purpose`, mesmo modelo da sessão.
Os prompts prontos estão em `out/prompt.md`, um por lote. Cada agente é cego: lê só o
catálogo e o próprio lote, e nunca sabe qual skill está sob teste.

Colete as 12 tabelas num `results.json`:

```json
{"B1C1": {"skills": ["action-button", "business-rule"], "conf": 70},
 "B1C3": {"skills": [], "conf": 40}}
```

`skills` = na ordem que o agente devolveu, 1ª escolha primeiro; `[]` = respondeu `NENHUMA`.
`conf` = confiança declarada na 1ª escolha.

```sh
python3 tools/skill-trigger-audit/audit.py score  runs/2026-07-31-antes.json
python3 tools/skill-trigger-audit/audit.py compare runs/antes.json runs/depois.json
```

Guarde cada `results.json` em `runs/AAAA-MM-DD-<rotulo>.json` — é o histórico da esteira.

## Desenho

3 cenários por skill, sempre a **primeira** mensagem do dev numa sessão nova:

| eixo | cenário | acerto |
|---|---|---|
| `O` óbvio | cita a anotação/artefato (`@Job`, `AcaoRotinaJava`) | skill é a 1ª escolha |
| `I` indireto | dev-speak de negócio, nenhum termo do SDK | skill é a 1ª escolha |
| `N` negativo | mensagem vizinha que deve cair noutra skill | a skill **não** é a 1ª escolha |

Os 12 lotes embaralham os eixos (`SHUFFLE`/`OFFSETS` em `audit.py`) para o agente não inferir
o padrão do lote, e distribuem as 24 skills de forma que nenhum lote repita skill.

## Critério de aceite

1. `O` e `I` disparam a skill certa em 1ª escolha, **sem** âncora no projeto.
2. `N` não dispara a skill sob teste.
3. Confiança no eixo `I` **≥ 80**. É o número que importa: acerto com conf ≤70 significa que a
   skill foi achada por inferência de domínio, não por termo casado — e inferência é o
   primeiro item a degradar em contexto longo.

## O que a esteira não mede

Ela pergunta ao agente "você carregaria skill?", o que força uma deliberação que a sessão real
não faz. Logo mede **discriminação** (olhando o catálogo, escolhe certo?), não **saliência**
(para pra olhar?). Saliência não cabe em `description`: depende de instrução always-on —
`docs/ADDON.md` via `/addon-studio:init`, ou o hook `SessionStart` do plugin como piso.

Corolário: `O`/`I` em 100% não autoriza remover o `ADDON.md`. Ver `skills/init/assets/ADDON.md`.
