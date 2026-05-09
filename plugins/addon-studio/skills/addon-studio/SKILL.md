---
name: addon-studio
description: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Use for @JapeEntity, datadictionary XML, dbscripts, REST controllers, Guice DI, MapStruct, JUnit+Mockito, MacroTranslator SQL macros, gradle deployAddon. Triggers on Java code with Sankhya annotations (@JapeEntity, @Repository, @Controller, @ControllerAdvice, @ExceptionHandler, @CustomModule, @Listener, @Callback, @ActionButton, @BusinessRule, @Job, @GlobalTypeAdapter, @Value, AcaoRotinaJava, Regra, IJob, TypeAdapter, ValueType), files in datadictionary/ or dbscripts/ or queries/, gradle deployAddon usage, MacroTranslator SQL macros (dbDate, nullValue, ignorecase, normalizeText, truncMonth, yearMonth, addMonths, etc.), or any mention of Addon Studio, JapeRepository, serviceName SP, botao de acao, regra de negocio, job agendado, adaptador de tipo, injecao de valor, tratamento global de excecao, macros SQL, MacroTranslator.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 projects (Wildfly/EJB + JAPE SDK). Requires Java 8, Gradle, ISO-8859-1 encoding for .java/.xml/.kt files. Targets Claude Code and OpenAI Codex CLI.
---

# Sankhya Addon Studio 2.0

Skill orienta implementacao em **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Foco: regras SDK + framework. **Sem opiniao arquitetural** — pacotes, camadas, design = decisao dev/projeto.

## Convencao de nomenclatura (parametrizada por projeto)

Aplica a tabelas/entities do addon. Padrao parametrizado por dois tokens — `<PRX>` (prefixo) + `<MOD3>` (modulo) — definidos pelo projeto:

| Artefato                              | Padrao                            | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:--------------------------------------|:----------------------------------|:-----------------------------|
| Tabela do addon                       | `<PRX><MOD3><CTX>` UPPER          | `TDCXYZCAB`                  |
| `@JapeEntity(entity = "...")`         | `<Prx><Mod><Ctx>` Pascal          | `TdcXyzCabecalho`            |
| Coluna custom em tabela nativa Sankhya| `<MOD3>_NOMECAMPO` UPPER          | `XYZ_STATUS`                 |

- `<PRX>` / `<Prx>` = prefixo fixo do projeto (ex.: `TDC`, `APP`, `CST` — UPPER 3-4 chars).
- `<MOD3>` / `<Mod>` = sigla 3 chars do modulo (ex.: `XYZ`, `FIN`, `FAT`).
- `<CTX>` / `<Ctx>` = contexto/entidade da tabela (ex.: `CAB`/`Cabecalho`, `ITE`/`Item`, `CFG`/`Configuracao`).

### Descobrir convencao do projeto

Antes de criar tabela/entity nova:

1. **Inspecionar projeto existente:** procurar `@JapeEntity(table = "...")` em arquivos `.java`, `<table name="...">` em `datadictionary/*.xml`, ou `CREATE TABLE` em `dbscripts/*.xml`. Se houver padrao consistente (ex.: todas tabelas comecam com `TDC`), reusar.
2. **Se nao houver padrao detectavel ou projeto for novo:** **perguntar ao dev** explicitamente:
   - "Qual prefixo (`<PRX>`) usar para tabelas custom deste projeto? Ex.: `TDC`, `APP`, `CST`."
   - "Qual sigla de 3 chars (`<MOD3>`) representa este modulo? Ex.: `XYZ`, `FIN`, `FAT`."
3. **Confirmar nome final** antes de gerar artefatos: `<PRX><MOD3><CTX>`.

## Indice por tarefa

| Tarefa                                                                | Arquivo                                            |
|:----------------------------------------------------------------------|:---------------------------------------------------|
| Stack, Java 8, Lombok, logging, restricoes gerais                     | `references/backend.md`             |
| Build / deploy local (`gradle deployAddon`)                           | `references/build.md`               |
| Criar/alterar entidade `@JapeEntity` (Lombok, PK, relacionamentos)    | `references/entity.md`              |
| XML dicionario dados (`datadictionary/<TABELA>.xml`)                  | `references/datadictionary.md`      |
| Scripts banco (`dbscripts/V<NNN>-*.xml`, dual mssql/oracle)           | `references/database.md`            |
| Repository (`@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying`) | `references/repository.md`          |
| Controller REST (`@Controller`, `serviceName SP`, `@Transactional`, DTO, `@Valid`, protocolo HTTP)   | `references/controller.md` |
| Injecao Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`) | `references/dependency-injection.md` |
| MapStruct (`@Mapper`, `componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge) | `references/mapstruct.md` |
| Testes (JUnit 5 + Mockito 4.11, mock estatico, `JapeRepository` quirks) | `references/test.md`              |
| Encoding arquivos (ISO-8859-1 obrigatorio em `.java`, `.xml`, `.kt`)  | `references/encoding.md`            |
| Botao acao (`@ActionButton`, `AcaoRotinaJava`, `@Form`, `ContextoAcao`)  | `references/actionbutton.md`     |
| Regra negocio (`@BusinessRule`, interface `Regra`, `ContextoRegra`, barramento, liberacao limite) | `references/businessrule.md` |
| Jobs agendados (`@Job`, interface `IJob`, `onSchedule`, `getScheduleConfigHook`, CRON, migracao XML)    | `references/job.md`          |
| Adaptadores tipo (`@GlobalTypeAdapter`, `TypeAdapter`, `JsonSerializer`, `JsonDeserializer`, nativos) | `references/typeadapter.md`  |
| Injecao valores (`@Value`, `ValueType`, `Provider<T>` lazy/eager, `SANKHYA_PARAM`, `group`)           | `references/value.md`        |
| Tratamento global excecoes (`@ControllerAdvice`, `@ExceptionHandler`, rollback automatico, DTO erro) | `references/controlleradvice.md` |
| Macros SQL Sankhya (`dbDate`, `nullValue`, `ignorecase`, `truncMonth`, etc. — portabilidade Oracle/MSSQL)  | `references/macros.md`           |

## Regras universais (validas em qualquer arquivo)

- **Encoding ISO-8859-1 obrigatorio.** Todo `.java`, `.xml`, `.kt` salvo Latin-1. LLMs geram UTF-8 — converter `iconv` apos criar/editar. Ver `references/encoding.md`.
- **Java 8 estrito.** Sem `var`, `List.of`, `Map.of`, `String.isBlank`, `Files.readString`, `Optional.ifPresentOrElse`, records, sealed classes, text blocks.
- **Lombok extensivo:** `@Data`, `@Builder`, `@AllArgsConstructor`, `@NoArgsConstructor`, `@Log`.
- **Logging:** `@Log` Lombok + `java.util.logging`. Nunca SLF4J. Nunca `System.out`.
- **Injecao:** via construtor com `@Inject` de **`com.google.inject.Inject`**. Nunca `javax.inject.Inject`. Nunca `new` em dependencia gerenciada.
- **Excecoes:** tipadas (estendem `RuntimeException`). Nunca `throw new RuntimeException(...)` cru.
- **Mappers:** sempre MapStruct. Nunca manual.
- **HTTP externo:** Retrofit + `RetrofitCallExecutor`. Nunca `HttpClient` nativo.
- **Repository:** interface estende `JapeRepository<TipoID, TipoEntidade>`. Nunca manual.
- **Persistencia:** `@JapeEntity` (SDK). Nunca JPA padrao (`javax.persistence.@Entity`).

## Quando perguntar antes de criar

- **Nome tabela nova:** descobrir/confirmar `<PRX>` + `<MOD3>` + `<CTX>` + nome final `<PRX><MOD3><CTX>` (ver "Descobrir convencao do projeto").
- **Campos auditoria** (`DHALTER`, `DHCREATE`, `CODUSU`): perguntar se inclui.
- **Convencao pacote / organizacao camadas:** **nao opinar.** Dev decide.

## Fluxo tipico de criacao de feature CRUD

1. XML dicionario dados em `datadictionary/<TABELA>.xml`.
2. Script banco em `dbscripts/V<NNN>-CREATE_TABLE_<TABELA>.xml`.
3. Entidade `@JapeEntity` (Java).
4. Repository (interface estende `JapeRepository`).
5. Servico aplicacao (anotado `@Component`, organizacao a criterio projeto).
6. Controller REST (`@Controller(serviceName = "...SP")`).
7. Request/Response DTOs + Mapper MapStruct.
8. Testes JUnit + Mockito.
9. Build: `gradle deployAddon` (ou `./gradlew deployAddon`).