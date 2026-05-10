---
name: value
description: Configura, revisa e debuga injeção `@Value` Sankhya (`ValueType`, `Provider<T>` lazy/eager, `SANKHYA_PARAM`, `group`). Use ao injetar, alterar, revisar ou auditar valores de configuração em componentes Guice, ao diagnosticar valor não injetado/null, ou ao tocar em código com `@Value`/`ValueType`/`SANKHYA_PARAM`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Injecao de Valores (`@Value`) — Addon Studio 2.0

`@Value` injeta valores de configuracao (env vars, system properties, parametros Sankhya) diretamente em campos de componentes gerenciados pelo Guice. Conversao de tipo automatica. Thread-safe.

> **Beta / Acesso Antecipado**: funcionalidade sujeita a mudancas.
>
> **Referencia complementar:** `dependency-injection`

---

## 1. Atributos

| Atributo       | Obrigatorio | Descricao                                                                 |
|:---------------|:------------|:--------------------------------------------------------------------------|
| `value`        | Nao*        | Nome da propriedade. Alternativa a `param`.                               |
| `param`        | Nao*        | Nome do parametro. Alternativa a `value`. **Tem precedencia sobre `value`**. |
| `group`        | Nao         | Grupo do parametro — exclusivo de `SANKHYA_PARAM`.                        |
| `type`         | Sim         | Fonte: `ENV_VAR`, `SYSTEM_PROPERTY`, `SANKHYA_PARAM` ou `UNDEFINED`.      |
| `defaultValue` | Sim         | Fallback quando a propriedade nao e encontrada. Nunca deixar vazio.        |

> * Ao menos um entre `value` ou `param` e obrigatorio.

---

## 2. Eager vs Lazy

| Modo   | Sintaxe                        | Resolucao               | Quando usar                              |
|:-------|:-------------------------------|:------------------------|:-----------------------------------------|
| Eager  | `private Integer porta`        | Na criacao do objeto    | Valor sempre necessario                  |
| Lazy   | `private Provider<Integer> porta` | Na primeira chamada `.get()`, cacheado | Valor condicional / feature flag |

```java
// Eager — resolvido na inicializacao
@Value(value = "server.port", type = ValueType.SYSTEM_PROPERTY, defaultValue = "8080")
private Integer serverPort;

// Lazy — resolvido so quando chamado, cacheado
@Value(param = "FEATURE_FLAG", type = ValueType.SANKHYA_PARAM, defaultValue = "false")
private Provider<Boolean> featureFlag;

public void executar() {
    if (featureFlag.get()) {  // resolve e cacheia na primeira chamada
        // ...
    }
}
```

---

## 3. Fontes (`ValueType`)

### `ENV_VAR` — variavel de ambiente

```java
@Value(value = "API_KEY", type = ValueType.ENV_VAR, defaultValue = "")
private String apiKey;
```

### `SYSTEM_PROPERTY` — propriedade Java (`-Dchave=valor`)

```java
@Value(value = "server.port", type = ValueType.SYSTEM_PROPERTY, defaultValue = "8080")
private Integer serverPort;
```

### `SANKHYA_PARAM` — parametro do sistema Sankhya

```java
// Sem grupo
@Value(param = "MAX_CONNECTIONS", type = ValueType.SANKHYA_PARAM, defaultValue = "10")
private Provider<Integer> maxConnections;

// Com grupo
@Value(param = "TIMEOUT", group = "CONNECTION", type = ValueType.SANKHYA_PARAM, defaultValue = "30")
private Provider<Long> connectionTimeout;
```

### `UNDEFINED` — sempre usa o `defaultValue`

```java
@Value(value = "qualquer", type = ValueType.UNDEFINED, defaultValue = "valor-fixo")
private String valorFixo;
```

---

## 4. Tipos suportados

`String`, `Integer`/`int`, `Boolean`/`boolean`, `Long`/`long`, `Double`/`double`, `Float`/`float` — e `Provider<T>` de qualquer um deles. Conversao de `String` para o tipo declarado e automatica.

---

## 5. Exemplo completo

```java
import br.com.sankhya.studio.annotations.Value;
import br.com.sankhya.studio.annotations.enums.ValueType;
import br.com.sankhya.studio.stereotypes.Component;
import com.google.inject.Inject;
import com.google.inject.Provider;

@Component
public class IntegracaoConfig {

    @Value(value = "API_BASE_URL", type = ValueType.ENV_VAR, defaultValue = "http://localhost:8080")
    private Provider<String> apiBaseUrl;

    @Value(value = "API_KEY", type = ValueType.ENV_VAR, defaultValue = "dev-key")
    private Provider<String> apiKey;

    @Value(param = "INTEGRACAO_ATIVA", type = ValueType.SANKHYA_PARAM, defaultValue = "false")
    private Provider<Boolean> integracaoAtiva;

    @Value(value = "http.timeout", type = ValueType.SYSTEM_PROPERTY, defaultValue = "30000")
    private Integer timeout;

    private final RetrofitCallExecutor executor;

    @Inject
    public IntegracaoConfig(RetrofitCallExecutor executor) {
        this.executor = executor;
    }

    public void enviar(Payload payload) {
        if (!integracaoAtiva.get()) return;
        executor.execute(apiBaseUrl.get(), apiKey.get(), payload, timeout);
    }
}
```

---

## 6. Restricoes

- **Somente em classes gerenciadas pelo Guice** (`@Component`, `@Controller`, `@Repository`, etc.). Em classes criadas com `new`, o campo fica `null`.
- **Nao funciona em campos `final`**.
- `group` e exclusivo de `SANKHYA_PARAM` — ignorado nas outras fontes.

---

## 7. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                       | Correcao                                          |
|:---------------------------------------------------|:--------------------------------------------------|
| Classe nao gerenciada com `@Value`                 | Anotar classe com `@Component` ou equivalente     |
| Campo `final` anotado com `@Value`                 | Remover `final`                                   |
| `defaultValue = ""` em valor critico               | Fornecer fallback significativo                   |
| `value` e `param` juntos (ambiguidade)             | Usar so `param` — tem precedencia de qualquer forma|
| `group` em `ENV_VAR` ou `SYSTEM_PROPERTY`          | `group` so funciona com `SANKHYA_PARAM`           |
| Eager em valor condicional (Feature Flag)          | Usar `Provider<T>` (Lazy)                         |

---

## 8. Checklist: Novo `@Value`

1. [ ] Classe anotada com estereotipo Guice (`@Component`, `@Controller`, etc.).
2. [ ] Escolher fonte correta: `ENV_VAR`, `SYSTEM_PROPERTY` ou `SANKHYA_PARAM`.
3. [ ] Usar `param` para `SANKHYA_PARAM` (com `group` se necessario); `value` para as demais.
4. [ ] Definir `defaultValue` com valor significativo — nunca string vazia em config critica.
5. [ ] Decidir Eager vs Lazy: `Provider<T>` se o valor for condicional ou opcional.
6. [ ] Campo nao e `final`.


## Related Skills

- `dependency-injection` — @Value injeta em @Component gerenciados pelo Guice

## Skills relacionadas

- `dependency-injection` — wiring Guice que injeta os `@Value`
- `addon-studio` — regras universais do projeto
