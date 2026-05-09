---
name: controller-advice
description: Implement Sankhya @ControllerAdvice + @ExceptionHandler with auto-rollback and error DTO. Use when writing global exception handlers in Sankhya Addon Studio projects.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Tratamento Global de Excecoes (`@ControllerAdvice`) — Addon Studio 2.0

`@ControllerAdvice` centraliza tratamento de excecoes de todos `@Controller` e `@Service`. Excecao capturada = **rollback automatico** da transacao ativa.

> **Beta / Acesso Antecipado**: funcionalidade sujeita a mudancas.
>
> **Referencia complementar:** `controller` — controllers devem deixar excecao propagar.

---

## 1. Anatomia

```java
import br.com.sankhya.studio.web.ControllerAdvice;
import br.com.sankhya.studio.web.ExceptionHandler;
import java.util.logging.Level;
import java.util.logging.Logger;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = Logger.getLogger(GlobalExceptionHandler.class.getName());

    @ExceptionHandler({ObjectNotFoundException.class})
    public ErrorResponse handleNotFound(ObjectNotFoundException e) {
        log.log(Level.INFO, "Recurso nao encontrado: {0}", e.getMessage());
        return new ErrorResponse("NOT_FOUND", e.getMessage(), 404);
    }

    @ExceptionHandler({IllegalArgumentException.class, ValidationException.class})
    public ErrorResponse handleValidation(Exception e) {   // parametro mais generico — OK
        log.log(Level.WARNING, "Validacao falhou", e);
        return new ErrorResponse("BAD_REQUEST", e.getMessage(), 400);
    }
}
```

---

## 2. Regras criticas

### Retorno NUNCA pode ser `void`

`@ExceptionHandler` deve retornar **objeto ou primitivo** — sera serializado para JSON via Gson. `void` causa erro de compilacao.

```java
// PROIBIDO
@ExceptionHandler({MinhaException.class})
public void handle(MinhaException e) { ... }

// CORRETO
@ExceptionHandler({MinhaException.class})
public ErrorResponse handle(MinhaException e) {
    return new ErrorResponse(...);
}
```

### Multiplas excecoes no mesmo handler

`@ExceptionHandler` aceita **array** de classes:

```java
@ExceptionHandler({IOException.class, SQLException.class, TimeoutException.class})
public ErrorResponse handleInfra(Exception e) {
    return new ErrorResponse("INFRA_ERROR", "Falha temporaria.", 503);
}
```

### Parametro pode ser superclasse das excecoes declaradas

Util quando varias excecoes compartilham tratamento:

```java
@ExceptionHandler({IOException.class, SQLException.class})
public ErrorResponse handle(Exception e) {  // Exception = superclasse comum
    ...
}
```

### Rollback automatico

Excecao capturada = transacao ativa revertida via `setRollbackOnly()`. Sem acao manual necessaria.

### NAO usar `@ExceptionHandler({Exception.class})`

Captura tudo (inclusive filhas), bloqueando handlers especificos. Sem ordem garantida entre `@ControllerAdvice` diferentes — handler generico de outra classe pode "roubar" excecao de handler especifico.

```java
// PROIBIDO
@ExceptionHandler({Exception.class})
public ErrorResponse handleAll(Exception e) { ... }

// CORRETO — declarar excecoes especificas
@ExceptionHandler({MinhaException.class, OutraException.class})
public ErrorResponse handle(Exception e) { ... }
```

### Sem ordem entre `@ControllerAdvice` distintos

Se duas classes `@ControllerAdvice` tratam a mesma excecao, framework escolhe **qualquer uma** sem ordem definida.

**Regra**: uma excecao = exatamente um handler em todo o projeto.

### Metodos sem `@ExceptionHandler` sao silenciosamente ignorados

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    // IGNORADO — nao tem @ExceptionHandler
    public ErrorResponse handle(MinhaException e) { ... }
}
```

---

## 3. DTO de erro

Estrutura fica a criterio do projeto. Tipos diferentes de excecao podem retornar DTOs diferentes (`NotFoundResponse`, `ValidationErrorResponse`, etc.). Padrao comum:

```java
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private int status;
    private long timestamp;

    public ErrorResponse(String code, String message, int status) {
        this(code, message, status, System.currentTimeMillis());
    }
}
```

> **Nunca** incluir `e.getStackTrace()` ou `e.toString()` no DTO. Stack trace fica no log; mensagem ao cliente e amigavel.

---

## 4. Niveis de log sugeridos

| Excecao                       | Level     |
|:------------------------------|:----------|
| `EntityNotFoundException`     | `INFO`    |
| `ObjectNotFoundException`     | `INFO`    |
| `IllegalArgumentException`    | `WARNING` |
| `DomainValidationException`   | `WARNING` |
| `ValidationException`         | `WARNING` |
| `IntegrationImportException`  | `WARNING` |
| `IntegrationExportException`  | `WARNING` |
| `IntegrationApiException`     | `WARNING` |
| `IntegrationNetworkException` | `WARNING` |
| `JapeSessionInterruptedError` | `SEVERE`  |
| `IOException` / `SQLException`| `SEVERE`  |
| `RuntimeException`            | `SEVERE`  |

---

## 5. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                              | Correcao                                            |
|:----------------------------------------------------------|:----------------------------------------------------|
| Handler retornando `void`                                 | Retornar objeto/primitivo                           |
| `@ExceptionHandler({Exception.class})` como pega-tudo     | Declarar excecoes especificas                       |
| Duplicar handler da mesma excecao em classes diferentes   | Uma excecao = um handler                            |
| Metodo em `@ControllerAdvice` sem `@ExceptionHandler`     | Adicionar a anotacao ou remover o metodo            |
| `@ExceptionHandler({})` (array vazio)                     | Declarar ao menos uma classe                        |
| Expor stack trace no DTO de resposta                      | Log no servidor; mensagem amigavel ao cliente       |
| Esquecer de logar a excecao                               | Sempre logar com `Level` adequado                   |
| `try/catch` em controller para excecao de negocio         | Deixar propagar — `@ControllerAdvice` trata         |

---

## 6. Checklist: Novo `@ControllerAdvice`

1. [ ] Verificar que projeto **nao** tem outro handler para as mesmas excecoes.
2. [ ] Anotar classe com `@ControllerAdvice`.
3. [ ] Cada metodo handler com `@ExceptionHandler({Excecao.class})` — array explicito.
4. [ ] Tipo de retorno e **objeto/primitivo** — nunca `void`.
5. [ ] Logger (`java.util.logging`) com `Level` adequado em todos os handlers.
6. [ ] DTO de resposta nao expoe stack trace nem dados sensiveis.
7. [ ] **Nao** declarar `@ExceptionHandler({Exception.class})`.
8. [ ] Confirmar que excecoes lancadas pela camada de servico estao mapeadas.


## Related Skills

- `controller` — controllers devem deixar exceção propagar até o advice
