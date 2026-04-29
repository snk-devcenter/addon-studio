# Backend — Sankhya Addon Studio 2.0

Stack e regras gerais de codigo Java em projetos Sankhya Addon Studio 2.0 (Wildfly/EJB).

> **Skill nao opina sobre arquitetura.** Organizacao de pacotes, camadas, padroes de design (Clean Arch, Hexagonal, MVC, DDD etc.) sao decisoes do dev/projeto. Este arquivo cobre **so** stack tecnologica + estilo de codigo + restricoes do framework.
>
> **Arquivos complementares (ler conforme tarefa):**
> - `entity-instructions.md` — Entidades `@JapeEntity`
> - `datadictionary-instructions.md` — Dicionario de Dados (XML)
> - `database-instructions.md` — Scripts banco (`dbscripts/`)
> - `repository-instructions.md` — Repositorios `@Repository`
> - `controller-instructions.md` — Controllers REST `@Controller`
> - `dependency-injection-instructions.md` — Injecao Guice
> - `mapstruct-instructions.md` — MapStruct
> - `test-instructions.md` — JUnit + Mockito
> - `build-instructions.md` — Build / deploy

---

## Stack tecnologica

| Item            | Versao / Detalhe                                                |
|:----------------|:----------------------------------------------------------------|
| Linguagem       | **Java 8 estrito**                                              |
| Container       | Wildfly + EJB                                                   |
| DI              | Google Guice (`com.google.inject.Inject`)                       |
| Persistencia    | JAPE (SDK Sankhya) via `@JapeEntity` + `JapeRepository`         |
| ORM             | JAPE (NAO usar JPA padrao `javax.persistence.@Entity`)          |
| Logging         | `java.util.logging` via `@Log` Lombok                           |
| Boilerplate     | Lombok (`@Data`, `@Builder`, `@AllArgsConstructor`, etc.)       |
| Mapeamento      | MapStruct 1.5.5+ (`componentModel=jakarta` global)              |
| HTTP externo    | Retrofit + Moshi via `RetrofitCallExecutor` (SDK)               |
| Validacao       | Bean Validation (`javax.validation.*`) + `@Valid`               |
| Testes          | JUnit 5 + Mockito 4.11 (5.x exige Java 11+)                     |
| Build           | Gradle (`gradle deployAddon`)                                   |

---

## Restricoes Java 8

**NAO use APIs pos-Java 8:**

- `var` (use tipagem explicita)
- `List.of(...)`, `Map.of(...)`, `Set.of(...)` (use `Arrays.asList`, `Collections.unmodifiableMap`)
- `String.isBlank()` (use `s == null || s.trim().isEmpty()`)
- `Files.readString(...)` (use `Files.readAllBytes` + `new String(...)`)
- `Optional.ifPresentOrElse(...)`, `Optional.or(...)`, `Optional.stream()`
- `Stream.toList()` (use `.collect(Collectors.toList())`)
- Records, sealed classes, pattern matching, text blocks

---

## Estilo de codigo

### Lombok obrigatorio

Use extensivo:

- `@Data` em entidades, DTOs, VOs
- `@NoArgsConstructor` + `@AllArgsConstructor` em entidades JAPE (framework precisa)
- `@Builder` quando construcao programatica fizer sentido
- `@Log` para acesso a `java.util.logging.Logger` como `log`
- `@Getter`, `@Setter`, `@AllArgsConstructor` em enums com `value`

### Logging

- **Sempre** `@Log` Lombok + `java.util.logging`.
- **Nunca** SLF4J (`org.slf4j.*`). **Nunca** `System.out.println`.
- Niveis: `INFO`, `WARNING`, `SEVERE`.

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

### Injecao de dependencia

- Sempre `@Inject` via construtor. Nunca em campo (excecao: mappers MapStruct `abstract class` com repository — ver `mapstruct-instructions.md`).
- `@Inject` de **`com.google.inject.Inject`**. Nunca `javax.inject.Inject`.
- Dependencias declaradas `private final`.
- Nunca usar `new` para criar dependencia gerenciada.

### Tipagem em campos numericos

| Contexto                                       | Tipo Java                  |
|:-----------------------------------------------|:---------------------------|
| PK de tabelas do addon (`COD*`/`NU*` propria)  | `Integer`                  |
| PK de tabelas nativas Sankhya (NUNOTA, CODPARC, etc.) | `BigDecimal`        |
| Valores monetarios, quantidades                | `BigDecimal`               |
| Flags S/N (mapeadas com `dataType="CHECKBOX"`) | `Boolean`                  |
| Datas com hora                                 | `Timestamp` (`java.sql.Timestamp`) |

---

## Excecoes

- **Nunca** lancar `RuntimeException` cru.
- Definir hierarquia de excecoes tipadas estendendo `RuntimeException` (ou uma base de excecoes do projeto).
- Mensagens voltadas a usuario de negocio (sem detalhes de infra/stack).

```java
public class IntegrationApiException extends RuntimeException {
    public IntegrationApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

Tratamento centralizado de excecoes em controllers via `@ControllerAdvice` — ver `controller-instructions.md`.

---

## O que NAO fazer

| Anti-pattern                                                     | Correcao                                                |
|:-----------------------------------------------------------------|:--------------------------------------------------------|
| Usar `var`                                                       | Tipagem explicita sempre                                |
| Usar JPA padrao (`javax.persistence.@Entity`, `@Table`)          | Usar `@JapeEntity` (SDK Sankhya)                        |
| Implementacao manual de Repository                               | Usar interface estendendo `JapeRepository<ID, Entity>`  |
| Usar `JapeWrapper` ou `EntityFacade` direto em controllers       | Sempre via Repository / `JapeRepository`                |
| Mapper escrito a mao (`new Dto(); dto.setX(...)`)                | Usar MapStruct                                          |
| `HttpClient` nativo / `URLConnection` para integracao externa    | Usar Retrofit + `RetrofitCallExecutor`                  |
| Logger SLF4J ou `System.out`                                     | `@Log` Lombok + `java.util.logging`                     |
| `new` para instanciar dependencia gerenciada                     | `@Inject` via construtor                                |
| Metadata UI (description, dataType, order) em entidade Java      | Vai no XML do dicionario de dados                       |
| `@Inject` de `javax.inject`                                      | Usar `com.google.inject.Inject`                         |
| `throw new RuntimeException(...)` cru                            | Excecao tipada                                          |

---

## Convencao do setor DevCenter (camada de persistencia)

Aplicada a tabelas e entities do addon:

| Artefato                              | Padrao                          | Exemplo               |
|:--------------------------------------|:--------------------------------|:----------------------|
| Tabela do addon (criada pelo projeto) | `TDC<MODULO3><CONTEXTO>` UPPER  | `TDCXYZCAB`           |
| `@JapeEntity(entity = "...")`         | `Tdc<Modulo><Contexto>` Pascal  | `TdcXyzCabecalho`     |
| Coluna custom em tabela nativa        | `<MOD>_NOMECAMPO` UPPER         | `XYZ_STATUS`          |

Detalhes: `database-instructions.md`, `entity-instructions.md`, `datadictionary-instructions.md`.
