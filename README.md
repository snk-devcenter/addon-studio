# Addon Studio Plugin

Plugin com **18 skills focadas + 6 sub-agents** — orienta implementacao em projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Mantido pelo setor DevCenter.

Compativel nativamente com **Claude Code** e **OpenAI Codex CLI** (padrao aberto Agent Skills / agentskills.io).

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
        ├── .claude-plugin/plugin.json              # manifest plugin Claude Code
        ├── .codex-plugin/plugin.json               # manifest plugin Codex CLI
        ├── hooks/hooks.json                        # hook PostToolUse encoding (Claude-only)
        ├── agents/                                 # 6 sub-agents (Claude Code only)
        │   ├── addon-reviewer.md                   # review pre-commit (sonnet)
        │   ├── entity-architect.md                 # modela trio CRUD (sonnet)
        │   ├── controller-designer.md              # @Controller + DTOs + Mapper (sonnet)
        │   ├── test-writer.md                      # JUnit 5 + Mockito 4.11 (sonnet)
        │   ├── troubleshooter.md                   # debug erros comuns (haiku)
        │   └── dbscript-builder.md                 # dbscripts dual MSSQL/Oracle (haiku)
        └── skills/
            ├── addon-studio/                       # overview + regras universais + naming + fluxo CRUD
            │   ├── SKILL.md
            │   └── agents/openai.yaml              # metadata Codex desta skill
            ├── action-button/SKILL.md              # @ActionButton (AcaoRotinaJava)
            ├── build/SKILL.md                      # gradle deployAddon
            ├── business-rule/SKILL.md              # @BusinessRule (Regra)
            ├── controller/SKILL.md                 # @Controller REST
            ├── controller-advice/SKILL.md          # @ControllerAdvice + @ExceptionHandler
            ├── data-dictionary/SKILL.md            # XML datadictionary/<TABELA>.xml
            ├── database/SKILL.md                   # dbscripts/V<NNN>-*.xml dual MSSQL/Oracle
            ├── dependency-injection/SKILL.md       # Guice DI
            ├── encoding/SKILL.md                   # ISO-8859-1 conversao
            ├── entity/SKILL.md                     # @JapeEntity
            ├── job/SKILL.md                        # @Job (IJob)
            ├── macros/SKILL.md                     # MacroTranslator SQL macros
            ├── mapstruct/SKILL.md                  # MapStruct mappers
            ├── repository/SKILL.md                 # @Repository / JapeRepository
            ├── test/SKILL.md                       # JUnit 5 + Mockito 4.11
            ├── type-adapter/SKILL.md               # @GlobalTypeAdapter
            └── value/SKILL.md                      # @Value / ValueType
```

> **Layout multi-plugin:** o repo serve como **marketplace + plugin**. Cada plugin futuro vai ganhar pasta propria em `plugins/<nome>/`. Exigencia do Codex CLI (path local tem que apontar pra subpasta do marketplace root, nao pra raiz).

## Cobertura (18 skills)

| Skill | Escopo |
|-------|--------|
| `addon-studio` | Overview, regras universais (Java 8 strict, Lombok, ISO-8859-1), naming `<PRX><MOD3><CTX>`, fluxo CRUD |
| `entity` | `@JapeEntity` (Lombok, PK simples/composta, relacionamentos) |
| `data-dictionary` | XML dicionario de dados |
| `database` | `dbscripts/V<NNN>-*.xml` dual MSSQL/Oracle |
| `repository` | `@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying` |
| `controller` | `@Controller(serviceName SP)`, DTO + `@Valid`, `@Transactional` |
| `controller-advice` | `@ControllerAdvice` + `@ExceptionHandler`, rollback automatico |
| `dependency-injection` | Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`) |
| `mapstruct` | `componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge |
| `test` | JUnit 5 + Mockito 4.11 (mock estatico, `JapeRepository` quirks) |
| `action-button` | `@ActionButton` (`AcaoRotinaJava`, `@Form`, `ContextoAcao`) |
| `business-rule` | `@BusinessRule` (`Regra`, `ContextoRegra`, barramento) |
| `job` | `@Job` (`IJob`, `onSchedule`, CRON, migracao XML) |
| `type-adapter` | `@GlobalTypeAdapter` (`TypeAdapter`, `JsonSerializer`/`JsonDeserializer`) |
| `value` | `@Value` / `ValueType` (`Provider<T>`, `SANKHYA_PARAM`) |
| `macros` | MacroTranslator SQL (`dbDate`, `nullValue`, `ignorecase`, etc.) |
| `encoding` | ISO-8859-1 obrigatorio em `.java`/`.xml`/`.kt` |
| `build` | `gradle deployAddon` |

## Convencao de nomenclatura (parametrizada por projeto)

Padrao parametrizado por `<PRX>` (prefixo) + `<MOD3>` (modulo). Skill detecta padrao existente no projeto; se ausente, **pergunta ao dev** antes de gerar artefatos.

| Artefato                              | Padrao                            | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:--------------------------------------|:----------------------------------|:-----------------------------|
| Tabela do addon                       | `<PRX><MOD3><CTX>` UPPER          | `TDCXYZCAB`                  |
| `@JapeEntity(entity = "...")`         | `<Prx><Mod><Ctx>` Pascal          | `TdcXyzCabecalho`            |
| Coluna custom em tabela nativa        | `<MOD3>_NOMECAMPO` UPPER          | `XYZ_STATUS`                 |

## Sub-agents (Claude Code only)

Agents sao especialistas com workflow ativo, tools restritas e modelo proprio. Diferente de skills (conhecimento/instrucao textual), agents executam decisao + acao.

| Agent | Modelo | Escopo |
|-------|:------:|--------|
| `addon-reviewer` | sonnet | Review pre-commit: encoding, Java 8, Lombok, Guice DI, `@JapeEntity`, anti-patterns. Saida em Blockers/Warnings/Suggestions. |
| `entity-architect` | sonnet | Modela trio CRUD end-to-end: XML dicionario + dbscript migration + entidade `@JapeEntity` Java. |
| `controller-designer` | sonnet | Desenha endpoint REST: `@Controller` + Request/Response DTOs + MapStruct Mapper + (se aplicavel) `@ControllerAdvice`. |
| `test-writer` | sonnet | Escreve JUnit 5 + Mockito 4.11 com quirks de `JapeRepository`. Roda `./gradlew test` pra validar. |
| `troubleshooter` | haiku | Diagnostica erros: encoding, Guice DI, JPA misturada com JAPE, Java 8 violations, build/deploy. |
| `dbscript-builder` | haiku | Gera dbscripts `V<NNN>-*.xml` dual MSSQL/Oracle (CREATE_TABLE minimo + ALTER por coluna). |

> **Codex CLI:** agents sao feature exclusiva do Claude Code. As 18 skills funcionam em ambos harnesses; os 6 agents sao ignorados pelo Codex CLI (sem perda — usuarios do Codex usam invocacao explicita das skills).

## Sem opiniao arquitetural

Skills cobrem **regras do SDK e do framework**. Organizacao de pacotes, camadas e padroes de design (Clean Arch, Hexagonal, MVC, DDD) sao decisoes do dev/projeto.

## Instalacao

A skill funciona nativamente em Claude Code e em OpenAI Codex CLI. Use o fluxo do harness que voce ja tem instalado.

### Claude Code

```
/plugin marketplace add snk-devcenter/addon-studio
/plugin install addon-studio@snk-devcenter
```

Apos instalado, skills ficam disponiveis via auto-trigger (descrições específicas) ou invocacao explicita: `/addon-studio:entity`, `/addon-studio:repository`, etc. Sub-agents aparecem em `/agents` e sao auto-invocados conforme contexto (ou explicitamente via comando).

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
| Hook PostToolUse encoding ISO-8859-1     | sim         | nao (rodar `iconv` apos editar — ver skill `encoding`) |
| Invocacao explicita por skill            | `/addon-studio:<skill>` | `$addon-studio:<skill>` |
| Sub-agents (`agents/*.md`)               | sim (6 agents disponiveis) | nao (feature exclusiva Claude Code) |
| Repo privado via `owner/repo`            | sim (usa `gh`/git auth do user) | nao (libgit2 interno; usar clone local + path) |

## Versionamento

Versoes seguem [SemVer](https://semver.org/lang/pt-BR/). Tag git por release: `v1.0.0`, `v1.1.0`, etc.
