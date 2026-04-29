---
name: addon-studio
description: Use when working on Sankhya Addon Studio 2.0 projects. Covers @JapeEntity entities, datadictionary XML, dbscripts migrations, @Controller REST endpoints, @Repository with @Criteria/@NativeQuery, MapStruct mappers, Guice DI (@Component/@CustomModule), JUnit+Mockito tests with SDK quirks, and gradle deployAddon. Triggers on Java code with Sankhya annotations (@JapeEntity, @Repository, @Controller, @CustomModule, @Listener, @Callback), files in datadictionary/ or dbscripts/, gradle deployAddon usage, or any mention of Addon Studio / JapeRepository / serviceName SP.
---

# Sankhya Addon Studio 2.0

Skill que orienta implementacao em projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Foco: regras do SDK e do framework. **Sem opiniao arquitetural** — organizacao de pacotes, camadas e padroes de design sao decisoes do dev/projeto.

## Convencao do setor DevCenter (camada de persistencia)

Aplicada a tabelas e entities criadas pelo addon:

| Artefato                              | Padrao                          | Exemplo               |
|:--------------------------------------|:--------------------------------|:----------------------|
| Tabela do addon                       | `TDC<MODULO3><CONTEXTO>` UPPER  | `TDCXYZCAB`           |
| `@JapeEntity(entity = "...")`         | `Tdc<Modulo><Contexto>` Pascal  | `TdcXyzCabecalho`     |
| Coluna custom em tabela nativa Sankhya| `<MOD>_NOMECAMPO` UPPER         | `XYZ_STATUS`          |

`<MODULO3>` / `<Modulo>` = sigla 3 caracteres do modulo do addon (ex.: `XYZ`, `FIN`, `FAT`).
`<CONTEXTO>` / `<Contexto>` = contexto/entidade da tabela (ex.: `CAB`/`Cabecalho`, `ITE`/`Item`, `CFG`/`Configuracao`).

## Indice por tarefa

| Tarefa                                                                | Arquivo                                            |
|:----------------------------------------------------------------------|:---------------------------------------------------|
| Stack, Java 8, Lombok, logging, restricoes gerais                     | `instructions/backend-instructions.md`             |
| Build / deploy local (`gradle deployAddon`)                           | `instructions/build-instructions.md`               |
| Criar / alterar entidade `@JapeEntity` (Lombok, PK, relacionamentos)  | `instructions/entity-instructions.md`              |
| XML do dicionario de dados (`datadictionary/<TABELA>.xml`)            | `instructions/datadictionary-instructions.md`      |
| Scripts de banco (`dbscripts/V<NNN>-*.xml`, dual mssql/oracle)        | `instructions/database-instructions.md`            |
| Repository (`@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying`) | `instructions/repository-instructions.md`          |
| Controller REST (`@Controller`, `serviceName SP`, `@Transactional`, DTO, `@ControllerAdvice`) | `instructions/controller-instructions.md` |
| Injecao Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`) | `instructions/dependency-injection-instructions.md` |
| MapStruct (`@Mapper`, `componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge) | `instructions/mapstruct-instructions.md` |
| Testes (JUnit 5 + Mockito 4.11, mock estatico, `JapeRepository` quirks) | `instructions/test-instructions.md`              |

## Regras universais (validas em qualquer arquivo)

- **Java 8 estrito.** Sem `var`, `List.of`, `Map.of`, `String.isBlank`, `Files.readString`, `Optional.ifPresentOrElse`, records, sealed classes, text blocks.
- **Lombok extensivo:** `@Data`, `@Builder`, `@AllArgsConstructor`, `@NoArgsConstructor`, `@Log`.
- **Logging:** `@Log` Lombok + `java.util.logging`. Nunca SLF4J. Nunca `System.out`.
- **Injecao:** sempre via construtor com `@Inject` de **`com.google.inject.Inject`**. Nunca `javax.inject.Inject`. Nunca `new` para dependencia gerenciada.
- **Excecoes:** tipadas (estendem `RuntimeException`). Nunca `throw new RuntimeException(...)` cru.
- **Mappers:** sempre MapStruct. Nunca implementacao manual.
- **HTTP externo:** Retrofit + `RetrofitCallExecutor`. Nunca `HttpClient` nativo.
- **Repository:** interface estendendo `JapeRepository<TipoID, TipoEntidade>`. Nunca implementacao manual.
- **Persistencia:** `@JapeEntity` (SDK). Nunca JPA padrao (`javax.persistence.@Entity`).

## Quando perguntar antes de criar

- **Nome de tabela nova:** confirmar `<MODULO3>` + `<CONTEXTO>` + nome final `TDC<MOD><CTX>`.
- **Campos de auditoria** (`DHALTER`, `DHCREATE`, `CODUSU`): perguntar se inclui.
- **Convencao de pacote / organizacao em camadas:** **nao opinar.** Dev decide.

## Fluxo tipico de criacao de feature CRUD

1. XML do dicionario de dados em `datadictionary/<TABELA>.xml`.
2. Script de banco em `dbscripts/V<NNN>-CREATE_TABLE_<TABELA>.xml`.
3. Entidade `@JapeEntity` (Java).
4. Repository (interface estendendo `JapeRepository`).
5. Servico de aplicacao (anotado `@Component`, organizacao a criterio do projeto).
6. Controller REST (`@Controller(serviceName = "...SP")`).
7. Request/Response DTOs + Mapper MapStruct.
8. Testes JUnit + Mockito.
9. Build: `gradle deployAddon` (ou `./gradlew deployAddon`).
