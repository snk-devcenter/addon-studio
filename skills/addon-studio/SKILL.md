---
name: addon-studio
description: Use when working on Sankhya Addon Studio 2.0 projects. Covers @JapeEntity entities, datadictionary XML, dbscripts migrations, @Controller REST endpoints, @Repository with @Criteria/@NativeQuery, MapStruct mappers, Guice DI (@Component/@CustomModule), JUnit+Mockito tests with SDK quirks, @ActionButton with AcaoRotinaJava/@Form/ContextoAcao, @BusinessRule with Regra/ContextoRegra/barramento/liberacao, @Job with IJob/onSchedule/CRON scheduling, @GlobalTypeAdapter with TypeAdapter/JsonSerializer/JsonDeserializer, @Value with ValueType/Provider lazy-eager/SANKHYA_PARAM, @ControllerAdvice with @ExceptionHandler/auto-rollback, MacroTranslator SQL macros (dbDate/nullValue/ignorecase/truncMonth/etc.) for Oracle/MSSQL portability, and gradle deployAddon. Triggers on Java code with Sankhya annotations (@JapeEntity, @Repository, @Controller, @ControllerAdvice, @ExceptionHandler, @CustomModule, @Listener, @Callback, @ActionButton, @BusinessRule, @Job, @GlobalTypeAdapter, @Value, AcaoRotinaJava, Regra, IJob, TypeAdapter, ValueType), files in datadictionary/ or dbscripts/ or queries/, gradle deployAddon usage, SQL macros (dbDate, nullValue, ignorecase, normalizeText, truncMonth, yearMonth, addMonths, etc.), or any mention of Addon Studio / JapeRepository / serviceName SP / botao de acao / regra de negocio / job agendado / adaptador de tipo / injecao de valor / tratamento global de excecao / macros SQL / MacroTranslator.
---

# Sankhya Addon Studio 2.0

Skill orienta implementacao em **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Foco: regras SDK + framework. **Sem opiniao arquitetural** — pacotes, camadas, design = decisao dev/projeto.

## Convencao do setor DevCenter (camada de persistencia)

Aplica a tabelas/entities do addon:

| Artefato                              | Padrao                          | Exemplo               |
|:--------------------------------------|:--------------------------------|:----------------------|
| Tabela do addon                       | `TDC<MODULO3><CONTEXTO>` UPPER  | `TDCXYZCAB`           |
| `@JapeEntity(entity = "...")`         | `Tdc<Modulo><Contexto>` Pascal  | `TdcXyzCabecalho`     |
| Coluna custom em tabela nativa Sankhya| `<MOD>_NOMECAMPO` UPPER         | `XYZ_STATUS`          |

`<MODULO3>` / `<Modulo>` = sigla 3 chars modulo addon (ex.: `XYZ`, `FIN`, `FAT`).
`<CONTEXTO>` / `<Contexto>` = contexto/entidade tabela (ex.: `CAB`/`Cabecalho`, `ITE`/`Item`, `CFG`/`Configuracao`).

## Indice por tarefa

| Tarefa                                                                | Arquivo                                            |
|:----------------------------------------------------------------------|:---------------------------------------------------|
| Stack, Java 8, Lombok, logging, restricoes gerais                     | `instructions/backend-instructions.md`             |
| Build / deploy local (`gradle deployAddon`)                           | `instructions/build-instructions.md`               |
| Criar/alterar entidade `@JapeEntity` (Lombok, PK, relacionamentos)    | `instructions/entity-instructions.md`              |
| XML dicionario dados (`datadictionary/<TABELA>.xml`)                  | `instructions/datadictionary-instructions.md`      |
| Scripts banco (`dbscripts/V<NNN>-*.xml`, dual mssql/oracle)           | `instructions/database-instructions.md`            |
| Repository (`@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying`) | `instructions/repository-instructions.md`          |
| Controller REST (`@Controller`, `serviceName SP`, `@Transactional`, DTO, `@Valid`, protocolo HTTP)   | `instructions/controller-instructions.md` |
| Injecao Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`) | `instructions/dependency-injection-instructions.md` |
| MapStruct (`@Mapper`, `componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge) | `instructions/mapstruct-instructions.md` |
| Testes (JUnit 5 + Mockito 4.11, mock estatico, `JapeRepository` quirks) | `instructions/test-instructions.md`              |
| Encoding arquivos (ISO-8859-1 obrigatorio em `.java`, `.xml`, `.kt`)  | `instructions/encoding-instructions.md`            |
| Botao acao (`@ActionButton`, `AcaoRotinaJava`, `@Form`, `ContextoAcao`)  | `instructions/actionbutton-instructions.md`     |
| Regra negocio (`@BusinessRule`, interface `Regra`, `ContextoRegra`, barramento, liberacao limite) | `instructions/businessrule-instructions.md` |
| Jobs agendados (`@Job`, interface `IJob`, `onSchedule`, `getScheduleConfigHook`, CRON, migracao XML)    | `instructions/job-instructions.md`          |
| Adaptadores tipo (`@GlobalTypeAdapter`, `TypeAdapter`, `JsonSerializer`, `JsonDeserializer`, nativos) | `instructions/typeadapter-instructions.md`  |
| Injecao valores (`@Value`, `ValueType`, `Provider<T>` lazy/eager, `SANKHYA_PARAM`, `group`)           | `instructions/value-instructions.md`        |
| Tratamento global excecoes (`@ControllerAdvice`, `@ExceptionHandler`, rollback automatico, DTO erro) | `instructions/controlleradvice-instructions.md` |
| Macros SQL Sankhya (`dbDate`, `nullValue`, `ignorecase`, `truncMonth`, etc. — portabilidade Oracle/MSSQL)  | `instructions/macros-instructions.md`           |

## Regras universais (validas em qualquer arquivo)

- **Encoding ISO-8859-1 obrigatorio.** Todo `.java`, `.xml`, `.kt` salvo Latin-1. LLMs geram UTF-8 — converter `iconv` apos criar/editar. Ver `instructions/encoding-instructions.md`.
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

- **Nome tabela nova:** confirmar `<MODULO3>` + `<CONTEXTO>` + nome final `TDC<MOD><CTX>`.
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