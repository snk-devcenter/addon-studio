# Addon Studio Plugin

Plugin com skill `addon-studio` — orienta implementacao em projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Mantido pelo setor DevCenter.

Compativel nativamente com **Claude Code** e **OpenAI Codex CLI** (padrao aberto SKILL.md / agentskills.io).

## Conteudo

```
.
├── .claude-plugin/
│   └── marketplace.json                            # catalogo Claude Code (raiz)
├── .agents/
│   └── plugins/
│       └── marketplace.json                        # catalogo Codex CLI (raiz)
└── plugins/
    └── addon-studio/
        ├── .claude-plugin/
        │   └── plugin.json                         # manifest plugin Claude Code
        ├── .codex-plugin/
        │   └── plugin.json                         # manifest plugin Codex CLI
        ├── hooks/
        │   └── hooks.json                          # hook PostToolUse encoding (Claude-only)
        └── skills/
            └── addon-studio/
                ├── SKILL.md                        # entrypoint da skill (universal)
                ├── agents/
                │   └── openai.yaml                 # politica/UI metadata (Codex)
                └── references/
                    ├── actionbutton.md
                    ├── backend.md
                    ├── build.md
                    ├── businessrule.md
                    ├── controller.md
                    ├── controlleradvice.md
                    ├── database.md
                    ├── datadictionary.md
                    ├── dependency-injection.md
                    ├── encoding.md
                    ├── entity.md
                    ├── job.md
                    ├── macros.md
                    ├── mapstruct.md
                    ├── repository.md
                    ├── test.md
                    ├── typeadapter.md
                    └── value.md
```

> **Layout multi-plugin:** o repo serve como **marketplace + plugin**. Cada plugin futuro vai ganhar pasta propria em `plugins/<nome>/`. Exigencia do Codex CLI (path local tem que apontar pra subpasta do marketplace root, nao pra raiz).

## Cobertura

- `@JapeEntity` — entidades (Lombok, PK simples/composta, relacionamentos)
- Dicionario de dados (XML)
- Scripts de banco (`dbscripts/V<NNN>-*.xml`, dual mssql/oracle)
- Repository (`@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying`)
- Controller REST (`@Controller(serviceName SP)`, DTO + `@Valid`, `@ControllerAdvice`)
- Injecao Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`)
- MapStruct (`componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge)
- Testes (JUnit 5 + Mockito 4.11, mock estatico, JapeRepository quirks)
- `@ActionButton`, `@BusinessRule`, `@Job`, `@GlobalTypeAdapter`, `@Value`, `@ControllerAdvice`
- MacroTranslator (macros SQL: `dbDate`, `nullValue`, `ignorecase`, `truncMonth`, etc.)
- Encoding ISO-8859-1 obrigatorio
- Build / deploy (`gradle deployAddon`)

## Convencao de nomenclatura (parametrizada por projeto)

Padrao parametrizado por `<PRX>` (prefixo) + `<MOD3>` (modulo). Skill detecta padrao existente no projeto; se ausente, **pergunta ao dev** antes de gerar artefatos.

| Artefato                              | Padrao                            | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:--------------------------------------|:----------------------------------|:-----------------------------|
| Tabela do addon                       | `<PRX><MOD3><CTX>` UPPER          | `TDCXYZCAB`                  |
| `@JapeEntity(entity = "...")`         | `<Prx><Mod><Ctx>` Pascal          | `TdcXyzCabecalho`            |
| Coluna custom em tabela nativa        | `<MOD3>_NOMECAMPO` UPPER          | `XYZ_STATUS`                 |

## Sem opiniao arquitetural

Skill cobre **regras do SDK e do framework**. Organizacao de pacotes, camadas e padroes de design (Clean Arch, Hexagonal, MVC, DDD) sao decisoes do dev/projeto.

## Instalacao

A skill funciona nativamente em Claude Code e em OpenAI Codex CLI. Use o fluxo do harness que voce ja tem instalado.

### Claude Code

```
/plugin marketplace add snk-devcenter/addon-studio
/plugin install addon-studio@snk-devcenter
```

### OpenAI Codex CLI

> **Atencao:** o repo `snk-devcenter/addon-studio` e privado. O Codex CLI nao respeita credenciais `gh`/git/SSH do usuario ao resolver `owner/repo` (libgit2 interno ignora credential helpers). Use o fluxo de **clone local** abaixo.

1. Clone o repo manualmente (usa seu `gh auth` ou chave SSH ja configurada):

   ```
   mkdir -p ~/.codex/marketplaces
   git clone git@github.com:snk-devcenter/addon-studio.git ~/.codex/marketplaces/addon-studio
   ```

2. Adicione o marketplace apontando para o caminho local:

   ```
   codex plugin marketplace add ~/.codex/marketplaces/addon-studio
   ```

3. Abra a TUI e instale:

   ```
   /plugins
   ```

   Escolha `snk-devcenter` -> `addon-studio` -> Install.

### Atualizar

Claude Code:

```
/plugin update addon-studio@snk-devcenter
```

Codex CLI (atualizar o clone local + recarregar marketplace):

```
git -C ~/.codex/marketplaces/addon-studio pull
codex plugin marketplace update snk-devcenter
```

E reinstalar via `/plugins` se necessario.

## Limitacoes por harness

| Recurso                                  | Claude Code | Codex CLI |
|:-----------------------------------------|:------------|:----------|
| Auto-trigger por `description` da skill  | sim         | sim       |
| Hook PostToolUse encoding ISO-8859-1     | sim         | nao (rodar `iconv` apos editar — ver `references/encoding.md`) |
| Invocacao explicita                      | `/addon-studio` | `$addon-studio` |
| Repo privado via `owner/repo`            | sim (usa `gh`/git auth do user) | nao (libgit2 interno; usar clone local + path) |

## Versionamento

Versoes seguem [SemVer](https://semver.org/lang/pt-BR/). Tag git por release: `v1.0.0`, `v1.1.0`, etc.
