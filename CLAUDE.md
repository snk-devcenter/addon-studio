# CLAUDE.md

Instruções para agentes trabalhando **neste repositório** (o plugin em si).

> Estas regras valem para o desenvolvimento do plugin. Elas **não** são as regras de projetos Sankhya Addon Studio consumidores — essas vivem em `plugins/addon-studio/skills/addon-studio/assets/ADDON.md`.

## O que é este repo

Marketplace Claude Code (`snk-devcenter`) + o plugin `addon-studio` (skills e sub-agents para projetos Sankhya Addon Studio 2.0).

```
.
├── CHANGELOG.md                        # histórico de mudanças (alimentado por PR)
├── .claude-plugin/marketplace.json     # catálogo do marketplace  [versão]
└── plugins/addon-studio/
    ├── .claude-plugin/plugin.json      # manifest do plugin       [versão]
    ├── hooks/                          # hook PostToolUse de encoding
    ├── agents/                         # sub-agents
    └── skills/<nome>/SKILL.md          # 1 diretório por skill
```

Não há build nem suíte de testes: o entregável é markdown + JSON. Validação = ler o diff e conferir os manifests (`jq . <arquivo>`).

## Versionamento — regra principal

**PR não mexe em versão.** Quem abre PR não decide release. Nenhum PR de conteúdo pode alterar:

- `plugins/addon-studio/.claude-plugin/plugin.json` → `version`
- `.claude-plugin/marketplace.json` → `plugins[].version`

Esses dois só mudam no **commit de corte de release**, junto da tag. (A badge do `README.md` é dinâmica — lê a última release pela API do shields.io, não precisa de bump.) Consequência prática: subject de commit e título de PR **não** carregam `(vX.Y.Z)` — o histórico antigo faz isso, é legado, não replicar.

## Fluxo de PR

1. Branch a partir de `main`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`.
2. Implementar a mudança nas skills/agents/hooks.
3. **Alimentar o `CHANGELOG.md`**: adicionar bullet em `## [Não publicado]`, sob o tipo certo (`Adicionado`, `Alterado`, `Corrigido`, `Removido`, `Depreciado`, `Segurança`). Criar a subseção do tipo se não existir.
   - Uma linha, imperativo, foco no efeito para quem usa o plugin — não no arquivo tocado.
   - Bom: `Skill \`job\` documenta o enum \`Transactional.TxType\`.`
   - Ruim: `Atualiza SKILL.md do job.`
   - Mudança sem efeito para o usuário (typo, reformatação interna) não precisa de entrada.
4. Commit em [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat(skill): ...`, `fix(hook): ...`, `docs: ...`, `chore: ...`. Sem versão no subject.
5. PR contra `main`, com o que mudou e por quê.

Um PR sem entrada no changelog só passa se a mudança for invisível para quem consome o plugin — nesse caso, dizer isso na descrição do PR.

## Corte de release

Ação deliberada, separada do merge da PR. Só executar quando o dev pedir explicitamente ("corta a release", "sobe a versão", "publica vX.Y.Z").

Decidir a versão pelo conteúdo acumulado em `[Não publicado]`:

| Tipo de mudança | Bump |
|---|---|
| Skill nova, sub-agent novo, hook novo, capability nova | **minor** |
| Correção/ajuste de conteúdo de skill existente, doc, fix de hook | **patch** |
| Quebra de layout do repo/manifest, remoção de skill, renomeação que quebra invocação existente | **major** |

Passos, em `main` atualizada:

1. `plugin.json` → `version` = nova versão.
2. `marketplace.json` → `plugins[].version` = mesma versão.
3. Se a release adiciona ou remove skill/sub-agent, atualizar a contagem nos **quatro** lugares que a citam: `description` do `plugin.json`, `description` do `marketplace.json`, chamada e título da tabela de cobertura no `README.md`, e a árvore em "Estrutura do repo".
4. `CHANGELOG.md`: renomear `## [Não publicado]` para `## [X.Y.Z] - AAAA-MM-DD` (data do corte), criar um `## [Não publicado]` vazio acima e atualizar os links de comparação no rodapé.
5. Commit único: `chore(release): vX.Y.Z`.
6. Tag anotada `vX.Y.Z` no commit de release; push do commit e da tag.
7. `gh release create vX.Y.Z --target <SHA de 40 chars> --title "vX.Y.Z - <resumo>" --notes "<seção do changelog>"`.

Checagem final: `plugin.json`, `marketplace.json` e o topo do `CHANGELOG.md` apontam para a mesma versão, e a tag existe.

## Conteúdo das skills

- **Skill é a fonte de verdade da API do SDK.** Assinatura documentada é validada contra os jars reais (`javap`) antes de entrar — a validação é QA do autor, não vira texto na skill.
- **Nunca carimbar a versão do SDK** em prosa ou frontmatter: o SDK lança semanalmente e o carimbo contradiz a skill como fonte de verdade.
- **Roteamento é feito pela `description` da skill**, não pelo `ADDON.md`. Skill nova não edita o `ADDON.md` — lá entram só regras always-on, que valem para qualquer prompt.
- **Exemplos sem dado real de cliente**: prefixo parametrizado `<PRX>`, sem branding, sem `resourceId` nativo ou perfil de app concreto.
- Skills e docs deste repo são markdown **UTF-8**. A regra ISO-8859-1 é conteúdo ensinado às skills (vale para `.java`/`.xml`/`.kt`/`.properties` do projeto consumidor), não para os arquivos daqui.
