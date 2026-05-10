---
name: addon-studio
description: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK) — overview do projeto, convenção de nomenclatura `<PRX><MOD3><CTX>`, regras universais (Java 8 strict, Lombok, ISO-8859-1, Guice DI, MapStruct, JapeRepository) e fluxo de feature CRUD. **Use sempre que o `build.gradle` ou `build.gradle.kts` do projeto aplicar o plugin Gradle `br.com.sankhya.addonstudio`** (fingerprint do SDK Sankhya — este plugin Claude Code é a fonte de verdade do projeto). Também use no início do projeto, ao definir naming convention, ao planejar feature CRUD end-to-end, ou ao precisar das regras universais Java 8/encoding/logging. NÃO usar para tarefas de tópico específico — invoque a skill focada (entity, repository, controller, etc.).
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Sankhya Addon Studio 2.0 — Overview

Skill orienta projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Foco: stack, regras universais, convenção de nomenclatura, fluxo CRUD. **Sem opinião arquitetural** — pacotes, camadas, design = decisão dev/projeto.

Para tópicos específicos (entidades, controllers, repositories, jobs, etc.), invoque a skill focada correspondente — ver "Skills do plugin" abaixo.

---

## Como detectar projeto Sankhya Addon Studio

Marca registrada: `build.gradle` ou `build.gradle.kts` aplica o plugin Gradle do SDK Sankhya.

```groovy
// build.gradle (Groovy DSL)
apply plugin: "br.com.sankhya.addonstudio"
```

```kotlin
// build.gradle.kts (Kotlin DSL)
plugins {
    id("br.com.sankhya.addonstudio")
}
```

**Se o projeto aplica esse plugin, este plugin Claude Code (`addon-studio`) é a fonte de verdade — siga as skills daqui.** Antes de gerar/alterar código:

1. Identifique o domínio (entity, repository, controller, controller-advice, dbscript, dicionário de dados, mapstruct, dependency-injection, action-button, business-rule, job, type-adapter, value, macros, encoding, build, test).
2. Invoque a skill focada correspondente — não improvise nem misture convenções de outros stacks (Spring Boot, Quarkus, JPA padrão, etc.).
3. Para regras universais (Java 8, Lombok, encoding ISO-8859-1, naming `<PRX><MOD3><CTX>`), volte neste overview.

> Conflito entre convenção do projeto e skill: **prevalece a skill** (a não ser que o projeto declare regra explícita em `CLAUDE.md` ou `AGENTS.md` na raiz).

---

## Stack tecnológica

| Item            | Versão / Detalhe                                                |
|:----------------|:----------------------------------------------------------------|
| Linguagem       | **Java 8 estrito**                                              |
| Container       | Wildfly + EJB                                                   |
| DI              | Google Guice (`com.google.inject.Inject`)                       |
| Persistência    | JAPE (SDK Sankhya) via `@JapeEntity` + `JapeRepository`         |
| ORM             | JAPE (NÃO usar JPA padrão `javax.persistence.@Entity`)          |
| Logging         | `java.util.logging` via `@Log` Lombok                           |
| Boilerplate     | Lombok (`@Data`, `@Builder`, `@AllArgsConstructor`, etc.)       |
| Mapeamento      | MapStruct 1.5.5+ (`componentModel=jakarta` global)              |
| HTTP externo    | Retrofit + Moshi via `RetrofitCallExecutor` (SDK)               |
| Validação       | Bean Validation (`javax.validation.*`) + `@Valid`               |
| Testes          | JUnit 5 + Mockito 4.11 (5.x exige Java 11+)                     |
| Build           | Gradle (`gradle deployAddon`)                                   |

---

## Restrições Java 8

**NÃO use APIs pós-Java 8:**

- `var` (use tipagem explícita)
- `List.of(...)`, `Map.of(...)`, `Set.of(...)` (use `Arrays.asList`, `Collections.unmodifiableMap`)
- `String.isBlank()` (use `s == null || s.trim().isEmpty()`)
- `Files.readString(...)` (use `Files.readAllBytes` + `new String(...)`)
- `Optional.ifPresentOrElse(...)`, `Optional.or(...)`, `Optional.stream()`
- `Stream.toList()` (use `.collect(Collectors.toList())`)
- Records, sealed classes, pattern matching, text blocks

---

## Estilo de código

### Lombok obrigatório

- `@Data` em entidades, DTOs, VOs
- `@NoArgsConstructor` + `@AllArgsConstructor` em entidades JAPE (framework precisa)
- `@Builder` quando construção programática fizer sentido
- `@Log` para acesso a `java.util.logging.Logger` como `log`
- `@Getter`, `@Setter`, `@AllArgsConstructor` em enums com `value`

### Logging

- **Sempre** `@Log` Lombok + `java.util.logging`.
- **Nunca** SLF4J (`org.slf4j.*`). **Nunca** `System.out.println`.
- Níveis: `INFO`, `WARNING`, `SEVERE`.

```java
@Log
public class Exemplo {
    public void executar() {
        log.log(Level.INFO, "Iniciando processo");
        try {
            // ...
        } catch (Exception e) {
            log.log(Level.SEVERE, "Falha ao executar: " + e.getMessage(), e);
        }
    }
}
```

### Injeção de dependência

- Sempre `@Inject` via construtor. Nunca em campo (exceção: mappers MapStruct `abstract class` com repository — ver skill `mapstruct`).
- `@Inject` de **`com.google.inject.Inject`**. Nunca `javax.inject.Inject`.
- Dependências declaradas `private final`.
- Nunca usar `new` para criar dependência gerenciada.

### Tipagem em campos numéricos

| Contexto                                       | Tipo Java                  |
|:-----------------------------------------------|:---------------------------|
| PK de tabelas do addon (`COD*`/`NU*` própria)  | `Integer`                  |
| PK de tabelas nativas Sankhya (NUNOTA, CODPARC, etc.) | `BigDecimal`        |
| Valores monetários, quantidades                | `BigDecimal`               |
| Flags S/N (mapeadas com `dataType="CHECKBOX"`) | `Boolean`                  |
| Datas com hora                                 | `Timestamp` (`java.sql.Timestamp`) |

---

## Exceções

- **Nunca** lançar `RuntimeException` cru.
- Definir hierarquia de exceções tipadas estendendo `RuntimeException`.
- Mensagens voltadas a usuário de negócio (sem detalhes de infra/stack).

```java
public class IntegrationApiException extends RuntimeException {
    public IntegrationApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

Tratamento centralizado em controllers — ver skill `controller-advice`.

---

## O que NÃO fazer

| Anti-pattern                                                     | Correção                                                |
|:-----------------------------------------------------------------|:--------------------------------------------------------|
| Usar `var`                                                       | Tipagem explícita sempre                                |
| Usar JPA padrão (`javax.persistence.@Entity`, `@Table`)          | Usar `@JapeEntity` (SDK Sankhya)                        |
| Implementação manual de Repository                               | Usar interface estendendo `JapeRepository<ID, Entity>`  |
| Usar `JapeWrapper` ou `EntityFacade` direto em controllers       | Sempre via Repository / `JapeRepository`                |
| Mapper escrito a mão (`new Dto(); dto.setX(...)`)                | Usar MapStruct                                          |
| `HttpClient` nativo / `URLConnection` para integração externa    | Usar Retrofit + `RetrofitCallExecutor`                  |
| Logger SLF4J ou `System.out`                                     | `@Log` Lombok + `java.util.logging`                     |
| `new` para instanciar dependência gerenciada                     | `@Inject` via construtor                                |
| Metadata UI (description, dataType, order) em entidade Java      | Vai no XML do dicionário de dados                       |
| `@Inject` de `javax.inject`                                      | Usar `com.google.inject.Inject`                         |
| `throw new RuntimeException(...)` cru                            | Exceção tipada                                          |

---

## Convenção de nomenclatura (parametrizada por projeto)

Aplica a tabelas/entities do addon. Padrão parametrizado por dois tokens — `<PRX>` (prefixo) + `<MOD3>` (módulo) — definidos pelo projeto:

| Artefato                              | Padrão                            | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:--------------------------------------|:----------------------------------|:-----------------------------|
| Tabela do addon                       | `<PRX><MOD3><CTX>` UPPER          | `TDCXYZCAB`                  |
| `@JapeEntity(entity = "...")`         | `<Prx><Mod><Ctx>` Pascal          | `TdcXyzCabecalho`            |
| Coluna custom em tabela nativa Sankhya| `<MOD3>_NOMECAMPO` UPPER          | `XYZ_STATUS`                 |

- `<PRX>` / `<Prx>` = prefixo fixo do projeto (ex.: `TDC`, `APP`, `CST` — UPPER 3-4 chars).
- `<MOD3>` / `<Mod>` = sigla 3 chars do módulo (ex.: `XYZ`, `FIN`, `FAT`).
- `<CTX>` / `<Ctx>` = contexto/entidade da tabela (ex.: `CAB`/`Cabecalho`, `ITE`/`Item`, `CFG`/`Configuracao`).

### Descobrir convenção do projeto

Antes de criar tabela/entity nova:

1. **Inspecionar projeto existente:** procurar `@JapeEntity(table = "...")` em arquivos `.java`, `<table name="...">` em `datadictionary/*.xml`, ou `CREATE TABLE` em `dbscripts/*.xml`. Se houver padrão consistente (ex.: todas tabelas começam com `TDC`), reusar.
2. **Se não houver padrão detectável ou projeto for novo:** **perguntar ao dev** explicitamente:
   - "Qual prefixo (`<PRX>`) usar para tabelas custom deste projeto? Ex.: `TDC`, `APP`, `CST`."
   - "Qual sigla de 3 chars (`<MOD3>`) representa este módulo? Ex.: `XYZ`, `FIN`, `FAT`."
3. **Confirmar nome final** antes de gerar artefatos: `<PRX><MOD3><CTX>`.

---

## Quando perguntar antes de criar

- **Nome tabela nova:** descobrir/confirmar `<PRX>` + `<MOD3>` + `<CTX>` + nome final `<PRX><MOD3><CTX>`.
- **Campos auditoria** (`DHALTER`, `DHCREATE`, `CODUSU`): perguntar se inclui.
- **Convenção pacote / organização camadas:** **não opinar.** Dev decide.

---

## Fluxo típico de criação de feature CRUD

1. XML dicionário de dados em `datadictionary/<TABELA>.xml` (skill `data-dictionary`).
2. Script banco em `dbscripts/V<NNN>-CREATE_TABLE_<TABELA>.xml` (skill `database`).
3. Entidade `@JapeEntity` Java (skill `entity`).
4. Repository estendendo `JapeRepository` (skill `repository`).
5. Serviço aplicação (`@Component`, organização a critério projeto — skill `dependency-injection`).
6. Controller REST `@Controller(serviceName = "...SP")` (skill `controller`).
7. Request/Response DTOs + Mapper MapStruct (skill `mapstruct`).
8. Testes JUnit + Mockito (skill `test`).
9. Build: `gradle deployAddon` (skill `build`).

---

## Skills do plugin

Para tópicos específicos, invoke skill direta:

- `entity` — entidades `@JapeEntity`
- `repository` — `@Repository` / `JapeRepository`
- `controller` — `@Controller` REST
- `controller-advice` — `@ControllerAdvice` / `@ExceptionHandler`
- `data-dictionary` — XML dicionário de dados
- `database` — `dbscripts/V<NNN>-*.xml`
- `dependency-injection` — Guice DI
- `mapstruct` — MapStruct mappers
- `test` — JUnit + Mockito
- `action-button` — `@ActionButton`
- `business-rule` — `@BusinessRule`
- `job` — `@Job`
- `type-adapter` — `@GlobalTypeAdapter`
- `value` — `@Value` / `ValueType`
- `macros` — MacroTranslator SQL macros
- `encoding` — ISO-8859-1
- `build` — `gradle deployAddon`

---

## Related Skills

- `entity` — primeiro artefato de uma feature CRUD
- `data-dictionary` — XML metadata da tabela
- `database` — dbscript de migration
- `controller` — endpoint REST que consome a feature
- `encoding` — regra crítica de Latin-1 aplicada em todo arquivo `.java`/`.xml`/`.kt`
