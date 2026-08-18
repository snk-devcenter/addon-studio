# Addon Studio Plugin

[![release](https://img.shields.io/github/v/release/snk-devcenter/addon-studio?label=release&color=blue)](https://github.com/snk-devcenter/addon-studio/releases/latest)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Plugin para **Claude Code e Codex CLI** com **24 skills focadas + 6 sub-agents** que orientam implementação em projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Mantido pelo DevCenter Squad.

As skills são a **fonte de verdade da API do SDK**: assinaturas validadas contra os jars reais (`studio-annotations`, `sdk-sankhya`). Seguir as skills gera código que compila e deploya — sem o agente precisar inspecionar jars.

## Instalação

Dentro do Claude Code, adicione o marketplace:

```
/plugin marketplace add snk-devcenter/addon-studio
```

Depois instale o plugin:

```
/plugin install addon-studio@snk-devcenter
```

## Setup do projeto (obrigatório, 1 comando)

Na raiz do projeto Sankhya, rode:

```
/addon-studio:init
```

A skill `init`:

1. Confere que o projeto é Addon Studio (procura `br.com.sankhya.addonstudio` no `build.gradle`/`build.gradle.kts`).
2. Copia o `ADDON.md` do plugin para `docs/ADDON.md` no projeto.
3. Insere a linha `@docs/ADDON.md` no `CLAUDE.md` da raiz (cria o arquivo se não existir; idempotente — não duplica nem mexe nas suas customizações).

Resultado:

```
projeto/
├── docs/
│   └── ADDON.md        # gerado pelo plugin — não editar
├── CLAUDE.md           # seu — contém `@docs/ADDON.md` + customizações do projeto
├── build.gradle
└── ...
```

**Por que precisa?** Skill discovery é semântica — o agente só carrega uma skill quando o prompt casa com a `description` dela. Num prompt genérico ("implementa essa spec"), o agente pode pular as regras universais (Java 8 strict, ISO-8859-1, JAPE não JPA). O `ADDON.md` importado no `CLAUDE.md` garante que essas regras estejam **sempre** no contexto.

## Como usar

### Auto-trigger (fluxo normal)

Trabalhe normalmente — as skills disparam sozinhas quando o assunto casa:

| Você pede | Skill que dispara |
|-----------|-------------------|
| "cria a entidade da tabela TDCXYZCAB" | `entity` (+ `data-dictionary`, `database` se for trio completo) |
| "preciso de um endpoint que recebe esse payload" | `controller` (+ `mapstruct`, `controller-advice`) |
| "consome essa API externa" | `retrofit` |
| "agenda esse processamento pra rodar de noite" | `job` |
| "preenche esse campo automático quando gravar o registro" | `listener` |
| "esse parâmetro não atualiza sem restart" | `value` |
| "erro Guice/BindingAlreadySet no deploy" | `dependency-injection` |
| "escreve testes pra esse service" | `test` |
| "tem util do Sankhya pra isso?" / null-check repetido no diff | `sankhya-utils` |
| "cria a tela HTML5 desse cadastro" / "botão novo na tela do addon" | `sankhya-js` |

### Invocação explícita

Qualquer skill pode ser chamada direto como slash command:

```
/addon-studio:entity
/addon-studio:repository
/addon-studio:controller
/addon-studio:value
...
```

### Sub-agents

No Claude Code, especialistas com workflow ativo, tools restritas e modelo próprio executam decisão + ação (diferente de skills, que são conhecimento). Aparecem em `/agents` e são auto-invocados conforme contexto, ou explicitamente ("usa o addon-reviewer nesse diff"):

| Agent | Modelo | Escopo |
|-------|:------:|--------|
| `addon-reviewer` | sonnet | Review pré-commit: encoding, Java 8, Lombok, Guice DI, `@JapeEntity`, anti-patterns. Saída em Blockers/Warnings/Suggestions. |
| `entity-architect` | sonnet | Modela trio CRUD end-to-end: XML dicionário + dbscript migration + entidade `@JapeEntity`. |
| `controller-designer` | sonnet | Desenha endpoint REST: `@Controller` + DTOs + MapStruct Mapper + (se aplicável) `@ControllerAdvice`. |
| `test-writer` | sonnet | Escreve JUnit 5 + Mockito 4.11 com quirks de `JapeRepository`. Roda `./gradlew test` pra validar. |
| `troubleshooter` | sonnet | Diagnostica erros: encoding, Guice DI, JPA misturada com JAPE, Java 8 violations, build/deploy. |
| `dbscript-builder` | haiku | Gera dbscripts `V<NNN>-*.xml` dual MSSQL/Oracle. |

#### Codex CLI

O Codex CLI 0.147.0 descobre agents em `~/.codex/agents/`, mas o manifest de plugin não tem campo `agents`; por isso a instalação do plugin não copia estes arquivos automaticamente. Depois de instalar `addon-studio@snk-devcenter`, copie os TOMLs distribuídos pelo plugin:

```bash
addon_studio_plugin="$(codex plugin list | awk '$1 == "addon-studio@snk-devcenter" { print $NF }')"
test -n "$addon_studio_plugin"
install -d "$HOME/.codex/agents"
cp -i "$addon_studio_plugin"/agents/codex/*.toml "$HOME/.codex/agents/"
```

Abra uma nova sessão após copiar. O `-i` evita sobrescrever uma customização local sem confirmação; repita a cópia para atualizar os agents junto do plugin.

O `dbscript-builder` usa `gpt-5.6-luna`; para os agents Sonnet, a proposta é `gpt-5.6-terra`. Os esforços são `high` para design/diagnóstico e `medium` para execução/review. A escolha dos modelos Sonnet ainda precisa de confirmação do mantenedor.

No Codex, peça o agent pelo nome; a `description` ajuda a escolha, mas não impõe auto-delegação. Roteamento: `entity-architect` para os três artefatos CRUD juntos; `dbscript-builder` para migration isolada; `controller-designer` para endpoint junto de DTOs/mapper; `test-writer` para suíte nova ou cobertura de vários arquivos; `troubleshooter` para causa-raiz ainda incerta; `addon-reviewer` antes de commit. Para mudança pontual, use a skill correspondente.

O allowlist Claude de comandos não tem equivalente: `addon-reviewer` é `read-only`; os demais são `workspace-write`. Assim, `Bash(git diff *)`, `Bash(./gradlew *)`, `Bash(iconv *)` e `Bash(python3 *)` não são restringidos individualmente no Codex.

### Hook de encoding

O plugin instala um hook PostToolUse que converte `.java`/`.xml`/`.kt`/`.properties` para **ISO-8859-1** após cada edição. Quando o acento já foi destruído na leitura (byte vira `U+FFFD`), o hook **aborta em vez de converter** e avisa o agente — nesse caso o trecho acentuado precisa ser restaurado (`git checkout -- <arquivo>`) e a edição reaplicada.

## Cobertura (24 skills)

| Skill | Escopo |
|-------|--------|
| `addon-studio` | Overview, regras universais (Java 8 strict, Lombok, ISO-8859-1), naming `<PRX><MOD3><CTX>`, fluxo CRUD |
| `init` | Setup do projeto: `docs/ADDON.md` + `@import` no `CLAUDE.md`. Re-rodar = upgrade idempotente |
| `entity` | `@JapeEntity` (Lombok, PK simples/composta, relacionamentos) |
| `data-dictionary` | XML dicionário de dados (`datadictionary/<TABELA>.xml`) |
| `database` | `dbscripts/V<NNN>-*.xml` dual MSSQL/Oracle |
| `repository` | `@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying` |
| `retrofit` | Retrofit + Moshi + OkHttp (deps `moduleLib`, interface client, wiring Guice, interceptors) |
| `controller` | `@Controller(serviceName SP)`, DTO + `@Valid`, `@Transactional` |
| `controller-advice` | `@ControllerAdvice` + `@ExceptionHandler`, rollback automático |
| `dependency-injection` | Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`) |
| `mapstruct` | `componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrão create/merge |
| `test` | JUnit 5 + Mockito 4.11 (quirks `JapeRepository`, mock estático `JapeSession`/`SessionFile`) |
| `action-button` | `@ActionButton` (`AcaoRotinaJava`, `@Form`, `ContextoAcao`) |
| `business-rule` | `@BusinessRule` (`Regra`, `ContextoRegra`, barramento) |
| `listener` | `@Listener` (`PersistenceEventAdapter`, eventos CRUD before/after insert/update/delete) |
| `before-load-listener` | `@BeforeLoadListener` (`FinderListener`, filtro transversal no Finder) |
| `job` | `@Job` (`IJob`, `onSchedule`, CRON, migração XML) |
| `type-adapter` | `@GlobalTypeAdapter` (`TypeAdapter`, `JsonSerializer`/`JsonDeserializer`) |
| `value` | `@Value` / `ValueType`, `parameter.xml`, feature flag toggável (`MGECoreParameter`) |
| `macros` | MacroTranslator SQL (`dbDate`, `nullValue`, `ignorecase`, etc.) |
| `sankhya-utils` | Utilitários `com.sankhya.util` (`StringUtils`, `BigDecimalUtil`, `TimeUtils`, `XMLUtils`, `SQLUtils`, `ResourceLock`) |
| `encoding` | ISO-8859-1 obrigatório em `.java`/`.xml`/`.kt`/`.properties` |
| `build` | `gradle deployAddon` |
| `sankhya-js` | Telas HTML5 do módulo `-vc` (AngularJS 1.x): `gerarTela`, `sk-application`/`sk-dynaform`/`sk-datagrid`, `ServiceProxy`, registro no menu |

## Atualização

```
/plugin update addon-studio@snk-devcenter
```

Depois re-rode `/addon-studio:init` no projeto: a skill sobrescreve o `docs/ADDON.md` com a versão nova **sem tocar** no seu `CLAUDE.md`.

## Customizações do projeto

Regras específicas (override de convenção, padrão de pacotes, arquitetura) vão no `CLAUDE.md` da raiz — **fora** do `docs/ADDON.md`, que é regenerado a cada update. O plugin nunca reescreve o `CLAUDE.md`; só insere o `@docs/ADDON.md` se ausente.

## Convenção de nomenclatura (parametrizada por projeto)

Padrão parametrizado por `<PRX>` (prefixo) + `<MOD3>` (módulo). A skill detecta o padrão existente no projeto; se ausente, **pergunta ao dev** antes de gerar artefatos.

| Artefato                              | Padrão                            | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:--------------------------------------|:----------------------------------|:-----------------------------|
| Tabela do addon                       | `<PRX><MOD3><CTX>` UPPER          | `TDCXYZCAB`                  |
| `@JapeEntity(entity = "...")`         | `<Prx><Mod><Ctx>` Pascal          | `TdcXyzCabecalho`            |
| Coluna custom em tabela nativa        | `<MOD3>_NOMECAMPO` UPPER          | `XYZ_STATUS`                 |

## Sem opinião arquitetural

Skills cobrem **regras do SDK e do framework**. Organização de pacotes, camadas e padrões de design (Clean Arch, Hexagonal, MVC, DDD) são decisões do dev/projeto.

## Estrutura do repo

```
.
├── CHANGELOG.md                        # histórico de mudanças
├── CLAUDE.md                           # regras de contribuição e corte de release
├── .claude-plugin/marketplace.json     # catálogo do marketplace
└── plugins/
    └── addon-studio/
        ├── .claude-plugin/plugin.json  # manifest do plugin
        ├── hooks/                      # hooks.json + to-iso88591.sh (PostToolUse de encoding)
        ├── agents/                     # 6 sub-agents Claude Code + TOMLs Codex em codex/
        └── skills/                     # 24 skills (1 dir por skill, SKILL.md cada)
            └── addon-studio/assets/ADDON.md   # template injetado no projeto consumidor
```

> **Layout multi-plugin:** o repo serve como marketplace + plugin; plugin futuro ganha pasta própria em `plugins/<nome>/`.

## Contribuindo

Regras de contribuição, política de versionamento e checklist de corte de release estão no [CLAUDE.md](CLAUDE.md). O essencial:

- Branch a partir de `main` (`feat/<slug>`, `fix/<slug>`, `docs/<slug>`), commit em Conventional Commits.
- Toda PR alimenta a seção `[Não publicado]` do [CHANGELOG.md](CHANGELOG.md).
- **PR não altera versão** — o bump acontece só no corte da release.

## Versionamento

[SemVer](https://semver.org/lang/pt-BR/), tag git por release (`v2.11.0`, ...). Histórico completo no [CHANGELOG.md](CHANGELOG.md); notas de cada versão nas [releases](https://github.com/snk-devcenter/addon-studio/releases).

## Licença

[MIT](LICENSE) — Copyright (c) 2026 DevCenter Squad.
