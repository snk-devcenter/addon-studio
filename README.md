# Addon Studio Plugin

[![release](https://img.shields.io/badge/release-v2.11.1-blue)](https://github.com/snk-devcenter/addon-studio/releases/latest)

Plugin para **Claude Code** com **21 skills focadas + 6 sub-agents** que orientam implementacao em projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Mantido pelo setor DevCenter.

As skills sao a **fonte de verdade da API do SDK**: assinaturas validadas contra os jars reais (`studio-annotations`, `sdk-sankhya`). Seguir as skills gera codigo que compila e deploya — sem o agente precisar inspecionar jars.

## Instalacao

Dentro do Claude Code, adicione o marketplace:

```
/plugin marketplace add snk-devcenter/addon-studio
```

Depois instale o plugin:

```
/plugin install addon-studio@snk-devcenter
```

## Setup do projeto (obrigatorio, 1 comando)

Na raiz do projeto Sankhya, rode:

```
/addon-studio:init
```

A skill `init`:

1. Confere que o projeto e Addon Studio (procura `br.com.sankhya.addonstudio` no `build.gradle`/`build.gradle.kts`).
2. Copia o `ADDON.md` do plugin para `docs/ADDON.md` no projeto.
3. Insere a linha `@docs/ADDON.md` no `CLAUDE.md` da raiz (cria o arquivo se nao existir; idempotente — nao duplica nem mexe nas suas customizacoes).

Resultado:

```
projeto/
├── docs/
│   └── ADDON.md        # gerado pelo plugin — nao editar
├── CLAUDE.md           # seu — contem `@docs/ADDON.md` + customizacoes do projeto
├── build.gradle
└── ...
```

**Por que precisa?** Skill discovery e semantica — o agente so carrega uma skill quando o prompt casa com a `description` dela. Num prompt generico ("implementa essa spec"), o agente pode pular as regras universais (Java 8 strict, ISO-8859-1, JAPE nao JPA). O `ADDON.md` importado no `CLAUDE.md` garante que essas regras estejam **sempre** no contexto.

## Como usar

### Auto-trigger (fluxo normal)

Trabalhe normalmente — as skills disparam sozinhas quando o assunto casa:

| Voce pede | Skill que dispara |
|-----------|-------------------|
| "cria a entidade da tabela TDCXYZCAB" | `entity` (+ `data-dictionary`, `database` se for trio completo) |
| "preciso de um endpoint que recebe esse payload" | `controller` (+ `mapstruct`, `controller-advice`) |
| "consome essa API externa" | `retrofit` |
| "agenda esse processamento pra rodar de noite" | `job` |
| "esse parametro nao atualiza sem restart" | `value` |
| "erro Guice/BindingAlreadySet no deploy" | `dependency-injection` |
| "escreve testes pra esse service" | `test` |

### Invocacao explicita

Qualquer skill pode ser chamada direto como slash command:

```
/addon-studio:entity
/addon-studio:repository
/addon-studio:controller
/addon-studio:value
...
```

### Sub-agents

Especialistas com workflow ativo, tools restritas e modelo proprio — executam decisao + acao (diferente de skills, que sao conhecimento). Aparecem em `/agents` e sao auto-invocados conforme contexto, ou explicitamente ("usa o addon-reviewer nesse diff"):

| Agent | Modelo | Escopo |
|-------|:------:|--------|
| `addon-reviewer` | sonnet | Review pre-commit: encoding, Java 8, Lombok, Guice DI, `@JapeEntity`, anti-patterns. Saida em Blockers/Warnings/Suggestions. |
| `entity-architect` | sonnet | Modela trio CRUD end-to-end: XML dicionario + dbscript migration + entidade `@JapeEntity`. |
| `controller-designer` | sonnet | Desenha endpoint REST: `@Controller` + DTOs + MapStruct Mapper + (se aplicavel) `@ControllerAdvice`. |
| `test-writer` | sonnet | Escreve JUnit 5 + Mockito 4.11 com quirks de `JapeRepository`. Roda `./gradlew test` pra validar. |
| `troubleshooter` | haiku | Diagnostica erros: encoding, Guice DI, JPA misturada com JAPE, Java 8 violations, build/deploy. |
| `dbscript-builder` | haiku | Gera dbscripts `V<NNN>-*.xml` dual MSSQL/Oracle. |

### Hook de encoding

O plugin instala um hook PostToolUse que mantem `.java`/`.xml`/`.kt`/`.properties` em **ISO-8859-1** automaticamente apos cada edicao — sem acao manual.

## Cobertura (21 skills)

| Skill | Escopo |
|-------|--------|
| `addon-studio` | Overview, regras universais (Java 8 strict, Lombok, ISO-8859-1), naming `<PRX><MOD3><CTX>`, fluxo CRUD |
| `init` | Setup do projeto: `docs/ADDON.md` + `@import` no `CLAUDE.md`. Re-rodar = upgrade idempotente |
| `entity` | `@JapeEntity` (Lombok, PK simples/composta, relacionamentos) |
| `data-dictionary` | XML dicionario de dados (`datadictionary/<TABELA>.xml`) |
| `database` | `dbscripts/V<NNN>-*.xml` dual MSSQL/Oracle |
| `repository` | `@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying` |
| `retrofit` | Retrofit + Moshi + OkHttp (deps `moduleLib`, interface client, wiring Guice, interceptors) |
| `controller` | `@Controller(serviceName SP)`, DTO + `@Valid`, `@Transactional` |
| `controller-advice` | `@ControllerAdvice` + `@ExceptionHandler`, rollback automatico |
| `dependency-injection` | Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`) |
| `mapstruct` | `componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge |
| `test` | JUnit 5 + Mockito 4.11 (quirks `JapeRepository`, mock estatico `JapeSession`/`SessionFile`) |
| `action-button` | `@ActionButton` (`AcaoRotinaJava`, `@Form`, `ContextoAcao`) |
| `business-rule` | `@BusinessRule` (`Regra`, `ContextoRegra`, barramento) |
| `before-load-listener` | `@BeforeLoadListener` (`FinderListener`, filtro transversal no Finder) |
| `job` | `@Job` (`IJob`, `onSchedule`, CRON, migracao XML) |
| `type-adapter` | `@GlobalTypeAdapter` (`TypeAdapter`, `JsonSerializer`/`JsonDeserializer`) |
| `value` | `@Value` / `ValueType`, `parameter.xml`, feature flag togglavel (`MGECoreParameter`) |
| `macros` | MacroTranslator SQL (`dbDate`, `nullValue`, `ignorecase`, etc.) |
| `encoding` | ISO-8859-1 obrigatorio em `.java`/`.xml`/`.kt` |
| `build` | `gradle deployAddon` |

## Atualizacao

```
/plugin update addon-studio@snk-devcenter
```

Depois re-rode `/addon-studio:init` no projeto: a skill sobrescreve o `docs/ADDON.md` com a versao nova **sem tocar** no seu `CLAUDE.md`.

## Customizacoes do projeto

Regras especificas (override de convencao, padrao de pacotes, arquitetura) vao no `CLAUDE.md` da raiz — **fora** do `docs/ADDON.md`, que e regenerado a cada update. O plugin nunca reescreve o `CLAUDE.md`; so insere o `@docs/ADDON.md` se ausente.

## Convencao de nomenclatura (parametrizada por projeto)

Padrao parametrizado por `<PRX>` (prefixo) + `<MOD3>` (modulo). A skill detecta o padrao existente no projeto; se ausente, **pergunta ao dev** antes de gerar artefatos.

| Artefato                              | Padrao                            | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:--------------------------------------|:----------------------------------|:-----------------------------|
| Tabela do addon                       | `<PRX><MOD3><CTX>` UPPER          | `TDCXYZCAB`                  |
| `@JapeEntity(entity = "...")`         | `<Prx><Mod><Ctx>` Pascal          | `TdcXyzCabecalho`            |
| Coluna custom em tabela nativa        | `<MOD3>_NOMECAMPO` UPPER          | `XYZ_STATUS`                 |

## Sem opiniao arquitetural

Skills cobrem **regras do SDK e do framework**. Organizacao de pacotes, camadas e padroes de design (Clean Arch, Hexagonal, MVC, DDD) sao decisoes do dev/projeto.

## Estrutura do repo

```
.
├── .claude-plugin/marketplace.json     # catalogo do marketplace
└── plugins/
    └── addon-studio/
        ├── .claude-plugin/plugin.json  # manifest do plugin
        ├── hooks/hooks.json            # hook PostToolUse de encoding
        ├── agents/                     # 6 sub-agents
        └── skills/                     # 21 skills (1 dir por skill, SKILL.md cada)
            └── addon-studio/assets/ADDON.md   # template injetado no projeto consumidor
```

> **Layout multi-plugin:** o repo serve como marketplace + plugin; plugin futuro ganha pasta propria em `plugins/<nome>/`.

## Versionamento

[SemVer](https://semver.org/lang/pt-BR/), tag git por release (`v2.11.0`, ...). Changelog nas [releases](https://github.com/snk-devcenter/addon-studio/releases).
