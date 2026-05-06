---
applyTo: "**/*Adapter.java"
---

# Adaptadores de Tipo (`@GlobalTypeAdapter`) — Addon Studio 2.0

`@GlobalTypeAdapter` registra adaptadores customizados no SDK para converter tipos entre JSON, objetos Java e valores Jape (camada de persistencia). Aplicado automaticamente em todo marshal/unmarshal de DTOs.

> **Beta / Acesso Antecipado**: funcionalidade sujeita a mudancas. Contato: developer@sankhya.com.br.
>
> **Referencias complementares:**
> - `entity-instructions.md` — Tipos suportados em `@JapeEntity`
> - `controller-instructions.md` — DTOs e serialização JSON

---

## 1. Quando criar um adaptador global

Use `@GlobalTypeAdapter` quando o tipo nao possui suporte nativo no SDK nem no Gson, ou quando o comportamento nativo precisa ser sobrescrito.

**Casos de uso comuns:**

| Situacao                                        | Exemplo                                    |
|:------------------------------------------------|:-------------------------------------------|
| Tipo `java.time.*` nao coberto pelos nativos    | `ZonedDateTime`, `YearMonth`               |
| Conversao customizada JSON ↔ Java               | Formato de data proprietario               |
| Sobrescrever adaptador nativo do SDK            | `BooleanAdapter` com logica diferente      |
| Tipo de dominio especifico do addon             | Value Objects, tipos wrapper               |

> Precedencia: **global > nativo**. Adaptador global sobrescreve o nativo equivalente.

---

## 2. Interfaces disponíveis

Classe anotada com `@GlobalTypeAdapter` pode implementar uma ou mais:

| Interface             | Responsabilidade                                          |
|:----------------------|:----------------------------------------------------------|
| `TypeAdapter<T>`      | Converte o tipo entre objeto Java e valor Jape (banco/VO) |
| `JsonSerializer<T>`   | Define como o tipo e convertido **para** JSON             |
| `JsonDeserializer<T>` | Define como o tipo e convertido **a partir de** JSON      |

Implemente somente as interfaces necessarias para o caso de uso.

---

## 3. Anatomia de um `@GlobalTypeAdapter`

```java
import br.com.sankhya.studio.stereotypes.GlobalTypeAdapter;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

@GlobalTypeAdapter
public class MeuTipoAdapter
        implements TypeAdapter<MeuTipo>, JsonSerializer<MeuTipo>, JsonDeserializer<MeuTipo> {

    // TypeAdapter<T> — conversao Java ↔ Jape (banco)
    @Override
    public MeuTipo fromVO(Object o) {
        if (o == null) return null;
        // converter valor do banco -> MeuTipo
    }

    @Override
    public Object toVO(MeuTipo value) {
        if (value == null) return null;
        // converter MeuTipo -> valor para banco
    }

    @Override
    public void setType(Class<? extends MeuTipo> aClass) {}  // geralmente vazio

    // JsonSerializer<T> — conversao Java -> JSON
    @Override
    public JsonElement serialize(MeuTipo value, Type type, JsonSerializationContext ctx) {
        return new JsonPrimitive(value.toString());
    }

    // JsonDeserializer<T> — conversao JSON -> Java
    @Override
    public MeuTipo deserialize(JsonElement el, Type type, JsonDeserializationContext ctx)
            throws JsonParseException {
        try {
            return MeuTipo.parse(el.getAsString());
        } catch (Exception e) {
            throw new JsonParseException("Erro ao desserializar MeuTipo: " + el, e);
        }
    }
}
```

---

## 4. Metodos de `TypeAdapter<T>`

| Metodo                                         | Descricao                                                     |
|:-----------------------------------------------|:--------------------------------------------------------------|
| `fromVO(Object o)`                             | Converte valor do banco/VO para objeto Java. Trate `null`.    |
| `toVO(T value)`                                | Converte objeto Java para valor compativel com Jape/banco.    |
| `setType(Class<? extends T> aClass)`           | Injetado pelo SDK com o tipo concreto. Geralmente corpo vazio.|

---

## 5. Exemplo completo — `ZonedDateTime`

`java.time.ZonedDateTime` nao tem suporte nativo no Gson. Adaptador completo com as tres interfaces:

```java
import br.com.sankhya.studio.stereotypes.GlobalTypeAdapter;
import com.google.gson.*;
import java.lang.reflect.Type;
import java.sql.Timestamp;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@GlobalTypeAdapter
public class ZonedDateTimeAdapter
        implements JsonSerializer<ZonedDateTime>, TypeAdapter<ZonedDateTime>, JsonDeserializer<ZonedDateTime> {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @Override
    public ZonedDateTime fromVO(Object o) {
        if (o == null) return null;
        Timestamp ts = (Timestamp) o;
        return ts.toInstant().atZone(ZoneId.systemDefault());
    }

    @Override
    public Object toVO(ZonedDateTime zonedDateTime) {
        if (zonedDateTime == null) return null;
        return Timestamp.from(zonedDateTime.toInstant());
    }

    @Override
    public void setType(Class<? extends ZonedDateTime> aClass) {}

    @Override
    public ZonedDateTime deserialize(JsonElement el, Type type, JsonDeserializationContext ctx)
            throws JsonParseException {
        try {
            return ZonedDateTime.parse(el.getAsString(), FORMATTER);
        } catch (Exception e) {
            throw new JsonParseException("Erro ao desserializar ZonedDateTime: " + el, e);
        }
    }

    @Override
    public JsonElement serialize(ZonedDateTime value, Type type, JsonSerializationContext ctx) {
        return new JsonPrimitive(FORMATTER.format(value));
    }
}
```

---

## 6. Adaptadores nativos do SDK (referencia)

Ja registrados automaticamente. Nao recriar sem necessidade — apenas sobrescrever se o comportamento precisar ser diferente.

| Adapter              | Tipo Java                                                 | Tipo Jape/Banco                            | Observacao                                               |
|:---------------------|:----------------------------------------------------------|:-------------------------------------------|:---------------------------------------------------------|
| `BooleanAdapter`     | `Boolean`                                                 | `String` ("S"/"N")                         | Leitura aceita `Character` e `String`                    |
| `ByteArrayAdapter`   | `byte[]`                                                  | `Blob`, `InputStream`, `byte[]`            |                                                          |
| `CharArrayAdapter`   | `char[]`                                                  | `String`, `Clob`                           |                                                          |
| `DateAdapter`        | `LocalDate`, `LocalTime`, `LocalDateTime`                 | `java.sql.Timestamp`                       | Tipo concreto definido via `setType`                     |
| `DurationAdapter`    | `java.time.Duration`                                      | `String` ISO-8601 ou segundos              | `toVO` retorna ISO; `fromVO` aceita ISO ou total seg     |
| `EnumAdapter`        | `Enum<?>`                                                 | `String`/`Number` via `getValue()`         | Fallback para `name()` se `getValue()` ausente           |
| `HashValueAdapter`   | `HashValue`                                               | `String` "ALGORITMO:hex"                   | Assume SHA-256 se algoritmo omitido                      |
| `InputStreamAdapter` | `java.io.InputStream`                                     | `Blob`, `byte[]`                           |                                                          |
| `InstantAdapter`     | `java.time.Instant`                                       | `String` ISO-8601 ou epoch millis          |                                                          |
| `JsonElementAdapter` | `com.google.gson.JsonElement`                             | `String` JSON                              | String vazia vira `JsonObject` vazio                     |
| `JsonObjectAdapter`  | `com.google.gson.JsonObject`                              | `String` JSON (objeto)                     | Lanca `IllegalArgumentException` se nao for objeto       |
| `NumberAdapter`      | `int`, `long`, `double`, `float`, `BigDecimal`, etc.      | `BigDecimal`                               |                                                          |
| `PeriodAdapter`      | `java.time.Period`                                        | `String` ISO-8601 ou "1Y-2M-15D"           |                                                          |
| `URLAdapter`         | `java.net.URL`                                            | `String`                                   | Valida e normaliza URLs                                  |
| `UUIDAdapter`        | `java.util.UUID`                                          | `String` canonico ou `byte[16]`            |                                                          |

---

## 7. Boas Praticas

- **Implemente somente o necessario**: se o tipo e usado so em JSON (DTO), basta `JsonSerializer` + `JsonDeserializer`. Se usado em entidade (`@JapeEntity`), inclua `TypeAdapter`.
- **Trate `null` explicitamente**: `fromVO` e `toVO` devem retornar `null` se entrada for `null`.
- **Lance `JsonParseException`** em erros de desserializacao — nunca retorne `null` silenciosamente.
- **`setType` pode ficar vazio** na maioria dos casos — e util apenas quando o adaptador precisa conhecer o subtipo concreto em runtime.
- **Nao recriar nativos sem motivo**: verifique a tabela de nativos antes de criar novo adaptador.

---

## 8. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                          | Correcao                                                        |
|:------------------------------------------------------|:----------------------------------------------------------------|
| Criar adaptador para tipo ja coberto nativamente      | Verificar tabela de nativos — so sobrescrever se necessario     |
| `fromVO` / `toVO` sem verificacao de `null`           | Sempre checar `null` primeiro                                   |
| Engolir excecao no `deserialize` retornando `null`    | Lancar `JsonParseException` com mensagem clara                  |
| Logica de negocio dentro do adaptador                 | Adaptador so converte — negocio fica no Service                 |
| Implementar as 3 interfaces quando so JSON e usado    | Implementar apenas `JsonSerializer` + `JsonDeserializer`        |

---

## 9. Checklist: Novo `@GlobalTypeAdapter`

1. [ ] Verificar se o tipo ja tem adaptador nativo na tabela da secao 6.
2. [ ] Criar classe anotada com `@GlobalTypeAdapter`.
3. [ ] Definir quais interfaces implementar (`TypeAdapter`, `JsonSerializer`, `JsonDeserializer`).
4. [ ] Implementar `fromVO` / `toVO` se tipo for usado em `@JapeEntity`.
5. [ ] Tratar `null` em todos os caminhos de `fromVO` e `toVO`.
6. [ ] Lancar `JsonParseException` (nunca silenciar) em erros de `deserialize`.
7. [ ] Manter `setType` com corpo vazio se subtipo concreto nao for relevante.
8. [ ] Registrar no modulo Guice do projeto (ver `dependency-injection-instructions.md`).
