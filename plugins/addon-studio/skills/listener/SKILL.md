---
name: listener
description: Cria, revisa e padroniza listeners de persistência Sankhya com `@Listener` (classe estende `PersistenceEventAdapter`) — reage a eventos CRUD (before/after insert, update, delete) de qualquer entidade JAPE, inclusive instâncias nativas. Use ao criar, alterar, revisar, auditar ou padronizar reação a gravação/exclusão de registros, ao validar ou preencher campos automaticamente no insert/update, ao exigir campo preenchido/não vazio (sinal prático: o dev fala do campo *da tabela* no insert/update, não de payload nem de tela — vale para qualquer origem de gravação: REST, tela, job, integração; se for só o payload que chega no endpoint, é `controller`; se for `NOT NULL` na coluna, é `database`), ao implementar auditoria de alterações (quem mudou e quando) — inclusive em documento nativo, como gravar automaticamente quem mudou o status do pedido —, ao reagir a mudança de status de um registro, ao bloquear gravação ou exclusão com exceção em `before*`, ao trabalhar com classes `*Listener` de persistência, ou ao tocar em código com `@Listener`/`PersistenceEventAdapter`/`PersistenceEvent`. NÃO usar para interceptar busca/carregamento/leitura de entidades (`FinderListener`, filtro em query) — isso é `@BeforeLoadListener`, skill `before-load-listener`. NÃO usar quando o gatilho é o barramento comercial do MGE e não a gravação do registro — validação que roda na confirmação/faturamento de documento do comercial via interface `Regra` + `ContextoRegra` (ex. liberação de limite de crédito) é `@BusinessRule`, skill `business-rule`. Gravação de registro, em qualquer tabela, é aqui.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Listener de Persistência (`@Listener`) — Addon Studio 2.0

`@Listener` executa lógica personalizada **em eventos de persistência (CRUD) de uma entidade JAPE** — antes/depois de insert, update e delete. Funciona em entidades do próprio add-on **e em instâncias nativas do sistema** (`CabecalhoNota`, `Parceiro`, `Produto`, etc.). A anotação registra o listener automaticamente — **sem edição manual de XML**.

> ⚠️ **`@Listener` ≠ `@BeforeLoadListener`.** São mecanismos distintos, com anotação, interface, evento e escopo diferentes: `@Listener` reage a **escrita** (insert/update/delete, via `PersistenceEventAdapter`); `@BeforeLoadListener` intercepta **leitura** (busca/carregamento no Finder, via `FinderListener`) — e só funciona em instâncias do próprio add-on. Tarefa de leitura/filtro de busca → skill `before-load-listener`.

---

## 1. Quando usar — `@Listener` vs `@BeforeLoadListener` vs `@BusinessRule` vs `@ActionButton`

| Mecanismo             | Escopo                                                   | Quando usar                                                                    |
|:----------------------|:----------------------------------------------------------|:--------------------------------------------------------------------------------|
| `@Listener`           | CRUD (insert/update/delete) de qualquer entidade          | Validar/preencher campos ao **gravar/excluir**; auditoria; reagir a mudança de dados. |
| `@BeforeLoadListener` | Toda busca/carregamento de UMA entidade (só do add-on)    | Filtro transversal em **leitura** (segurança, multi-tenant, soft-delete).       |
| `@BusinessRule`       | Confirmação/faturamento de notas                          | Regras transacionais comerciais com barramento de regras.                       |
| `@ActionButton`       | Ação disparada pelo usuário na tela                       | Processamento sob demanda, não automático por evento.                           |

**Regra rápida:** reagir a **gravação/exclusão** de registro (automático, sem clique)? `@Listener`. Filtrar **leitura**? `@BeforeLoadListener`. Regra de nota no barramento comercial? `@BusinessRule`.

> Diferente do `@BeforeLoadListener`, o `@Listener` **pode** escutar instâncias nativas do sistema (`CabecalhoNota`, `Financeiro`, `Parceiro`, etc.).

---

## 2. Anatomia

```java
import br.com.sankhya.jape.event.PersistenceEvent;
import br.com.sankhya.jape.event.PersistenceEventAdapter;
import br.com.sankhya.jape.vo.DynamicVO;
import br.com.sankhya.jape.vo.EntityVO;
import br.com.sankhya.studio.annotations.Listener;
import com.google.inject.Inject;
import lombok.extern.java.Log;

import java.math.BigDecimal;

@Log
@Listener(instanceNames = "PrxXyzPedido")
public class PrxXyzPedidoListener extends PersistenceEventAdapter {

    private final CalculoPedidoService calculoService;

    @Inject
    public PrxXyzPedidoListener(CalculoPedidoService calculoService) {
        this.calculoService = calculoService;
    }

    @Override
    public void beforeInsert(PersistenceEvent event) throws Exception {
        DynamicVO vo = (DynamicVO) event.getVo();
        BigDecimal total = calculoService.calcularTotal(vo.asBigDecimalOrZero("VLRUNIT"),
            vo.asBigDecimalOrZero("QTD"));
        vo.setProperty("VLRTOT", total);
    }

    @Override
    public void beforeUpdate(PersistenceEvent event) throws Exception {
        // Recalcula apenas se algum campo relevante mudou
        if (!event.getModifingFields().isModifingAny("VLRUNIT,QTD")) return;
        BigDecimal total = calculoService.calcularTotal(valorAtual(event, "VLRUNIT"),
            valorAtual(event, "QTD"));
        ((DynamicVO) event.getVo()).setProperty("VLRTOT", total);
    }

    // VO do beforeUpdate so traz os campos alterados: o que nao mudou vem do registro anterior
    private static BigDecimal valorAtual(PersistenceEvent event, String campo) {
        EntityVO origem = event.getModifingFields().isModifing(campo) ? event.getVo() : event.getOldVO();
        return ((DynamicVO) origem).asBigDecimalOrZero(campo);
    }
}
```

- Classe **estende** `br.com.sankhya.jape.event.PersistenceEventAdapter` e sobrescreve só os eventos de interesse.
- Listener é **entrypoint fino**: filtra o evento, manipula o `DynamicVO` e **delega a regra de negócio** a service/use case injetado.
- No `beforeUpdate` o VO do evento só traz PK + campos alterados — **não** reaproveite o `beforeInsert` lendo o VO: campo não alterado viria `null` (zero no cálculo). Valor atual = novo se alterado, senão `getOldVO()`. Regra na entidade tipada: §7.

---

## 3. Atributo da anotação `@Listener`

| Atributo        | Tipo       | Obrigatório | Descrição                                                                                   |
|:----------------|:-----------|:------------|:----------------------------------------------------------------------------------------------|
| `instanceNames` | `String[]` | Sim         | Nome(s) da(s) **instância(s)** a escutar — o mesmo valor de `@JapeEntity(entity = "...")`, de `<instance name="...">` no XML, ou o nome da instância nativa. **Não** é o nome da tabela. |

```java
@Listener(instanceNames = "PrxXyzPedido")                        // uma instancia
@Listener(instanceNames = {"CabecalhoNota", "Financeiro"})       // varias instancias (nativas)
```

> **Gotcha:** `instanceNames` é o **nome lógico da entidade**, não a tabela. Para `@JapeEntity(entity = "PrxXyzPedido", table = "PRXXYZPED")`, usa-se `@Listener(instanceNames = "PrxXyzPedido")`.

---

## 4. Eventos disponíveis (`PersistenceEventAdapter`)

| Método                                 | Momento                  | Uso típico                                                          |
|:---------------------------------------|:--------------------------|:---------------------------------------------------------------------|
| `beforeInsert(PersistenceEvent)`       | Antes de inserir           | Preencher/validar campos; exceção **bloqueia** a inserção.           |
| `afterInsert(PersistenceEvent)`        | Depois de inserir          | Auditoria, enfileirar processamento, propagar para outra entidade.   |
| `beforeUpdate(PersistenceEvent)`       | Antes de atualizar         | Recalcular campos derivados; validar transição de status.            |
| `afterUpdate(PersistenceEvent)`        | Depois de atualizar        | Reagir a mudança efetivada (ex.: status mudou para "Enviado").       |
| `beforeDelete(PersistenceEvent)`       | Antes de excluir           | Impedir exclusão (exceção bloqueia); limpeza de dependências.        |
| `afterDelete(PersistenceEvent)`        | Depois de excluir          | Auditoria de exclusão, propagação.                                   |

- Todos declaram `throws Exception`. Em `before*`, exceção lançada **cancela a operação** e propaga a mensagem ao usuário — use exceção tipada com mensagem de negócio.
- Alterações no `DynamicVO` feitas em `before*` são persistidas junto com a operação — **não** chame save.
- Em `after*` o registro já foi gravado — alterar o VO ali **não** persiste nada.
- O adapter também expõe hooks avançados (`afterLoadValueObject`, `afterRetrieveValueObject`, `updateRequired`, `transferData`) — raramente necessários.

---

## 5. API do `PersistenceEvent`

| Método                  | Retorno                                       | Uso                                                                       |
|:-------------------------|:-----------------------------------------------|:----------------------------------------------------------------------------|
| `getVo()`               | `EntityVO` — **cast para `DynamicVO`**         | Dados atuais do registro (ler/alterar campos).                             |
| `getOldVO()`            | `EntityVO`                                     | Registro completo **antes** do update, relido do banco. Só em `beforeUpdate`. |
| `getModifingFields()`   | `ModifingFields`                               | Quais campos estão sendo alterados. Só em `beforeUpdate`/`afterUpdate` — ver §6. |
| `getJdbcWrapper()`      | `br.com.sankhya.jape.dao.JdbcWrapper`          | JDBC **dentro da transação corrente**. Nunca feche a conexão.              |
| `getEntity()`           | `EntityMetaData`                               | Metadados da entidade (`getEntity().getName()`, etc.).                     |

```java
DynamicVO vo = (DynamicVO) event.getVo();  // getVo() retorna EntityVO — cast obrigatorio
```

> **Gotcha de pacote:** `JdbcWrapper` do evento é `br.com.sankhya.jape.dao.JdbcWrapper` — **não** `br.com.sankhya.jape.util`.

### Métodos úteis do `DynamicVO`

| Método                          | Uso                                                            |
|:---------------------------------|:-----------------------------------------------------------------|
| `getProperty("CAMPO")`          | Lê valor cru (`Object`, `null` se ausente).                     |
| `setProperty("CAMPO", valor)`   | Altera campo — em `before*`, persiste junto com a operação.     |
| `asBigDecimalOrZero("CAMPO")`   | `BigDecimal` (zero se nulo) — ideal para cálculo.               |
| `asBigDecimal` / `asString` / `asInt` | Conversões tipadas.                                       |

### Do VO à entidade tipada — `EntityMapper.fromVO`

Para trabalhar com a entidade `@JapeEntity` em vez de strings de campo:

```java
import br.com.sankhya.sdk.data.repository.impl.EntityMapper;

PrxXyzPedido pedido = EntityMapper.fromVO(event.getVo(), PrxXyzPedido.class);
if (!pedido.deveProcessar()) return;  // regra de dominio na entidade, nao no listener
```

> `fromVO(event.getVo())` monta a entidade com **o que veio no VO**: completa no insert e nos eventos `after*` (use `EventEntity.afterPersist`, §7), só PK + delta no `beforeUpdate`. Para ler e **alterar** a entidade em `beforeUpdate` e devolver ao VO, ver §7 — `EntityMapper.updateVO` ali apaga dados.

> **Gotcha — variável tipada:** a assinatura é `<T> T fromVO(EntityVO, Class<?>)` — o `T` vem do lado esquerdo da atribuição, não da classe passada. Encadear a chamada (`EntityMapper.fromVO(event.getVo(), PrxXyzPedido.class).deveProcessar()`) não compila: `cannot find symbol ... location: class Object`. Guarde numa variável do tipo da entidade, como acima.

> **Gotcha — `""` em coluna numérica:** código nativo pode gravar `""` em coluna numérica para dizer "vazio". O `NumberAdapter` do SDK faz `new BigDecimal(String)` com o valor, e `fromVO`/`adaptFromVO` estouram `NumberFormatException` antes de a regra rodar. Paliativo no projeto: troque o `""` por `null` só durante a conversão (tire do VO antes do `fromVO` e devolva depois, para não mudar o que o nativo grava) e, no `fromUpdate` do `EventEntity` (§7), trate o `getNewValue` antes do `adaptFromVO`. `NumberFormatException` em listener de instância nativa: suspeite primeiro de `""`.

---

## 6. `ModifingFields` — filtrar updates por campo alterado

`beforeUpdate`/`afterUpdate` disparam em **qualquer** update da instância — e o VO do `beforeUpdate` **só traz os campos alterados** (no `afterUpdate` o `getVo()` traz o registro completo). Filtre pelo que mudou:

| Método                        | Uso                                                            |
|:-------------------------------|:-----------------------------------------------------------------|
| `isModifing("CAMPO")`         | `true` se o campo está sendo alterado neste update.             |
| `isModifingAny("C1,C2")`      | `true` se qualquer um dos campos (lista separada por vírgula) está sendo alterado — substitui `isModifing(A) \|\| isModifing(B)`. |
| `getOldValue("CAMPO")`        | Valor anterior do campo **alterado** (ver gotchas abaixo).      |
| `getNewValue("CAMPO")`        | Valor novo do campo **alterado** (ver gotchas abaixo).          |

```java
@Override
public void beforeUpdate(PersistenceEvent event) throws Exception {
    DynamicVO vo = (DynamicVO) event.getVo();
    // Preenche vendedor preferencial so quando CODPARC muda sem CODVEND explicito
    if (event.getModifingFields().isModifing("CODPARC")
            && !event.getModifingFields().isModifing("CODVEND")) {
        preencherVendedorDoParceiro(vo);
    }
}
```

> **Gotcha:** no `beforeUpdate`, `vo.getProperty("CAMPO")` de campo **não alterado** pode vir `null` — o VO do evento só carrega o delta. Precisa do registro completo em `after*`? `EventEntity.afterPersist` (§7) lê a entidade do `getVo()`, que nos eventos `after*` traz o registro completo.

> **Gotchas do `ModifingFields`:**
> - `getOldValue("CAMPO")` de campo **não alterado** **não** devolve o valor anterior: devolve `getProperty` do próprio VO do evento (no `beforeUpdate`, o mesmo delta de `getVo()`), que pode vir `null`. Estado anterior completo: `event.getOldVO()`.
> - `getNewValue("CAMPO")` de campo não alterado lança `IllegalStateException` — cheque `isModifing("CAMPO")` antes.
> - `getModifingFields()` fora de `beforeUpdate`/`afterUpdate` e `getOldVO()` fora de `beforeUpdate` lançam `PersistenceError`.
> - Em teste, **não** use mock de `ModifingFields`: stub de `isModifing` não alimenta `isModifingAny` (devolve `false`) e o teste passa sem exercitar o filtro. Use a instância real — ver skill `test`.

---

## 7. Regra na entidade tipada, não no `DynamicVO`

O SDK converte nos dois sentidos: `EntityMapper.fromVO(EntityVO, Classe)` (VO → entidade) e `EntityMapper.updateVO(entidade, vo, Classe)` (entidade → VO). O par `fromVO` + regra + `updateVO` é seguro em `beforeInsert` — o VO da inclusão traz o registro inteiro — e **apaga dados em `beforeUpdate`**:

- O VO do `beforeUpdate` só traz PK + campos alterados; os demais `@Column` chegam `null` na entidade.
- `updateVO` grava **todo** `@Column` no VO, inclusive `null`. Não há rastreio de alteração para `@Column`.
- O JAPE decide o que mudou **comparando valores** (VO × registro no banco): campo que não veio no evento é ignorado, mas campo que voltou `null` conta como alterado para nulo. As colunas fora do evento são anuladas — ou o update falha com `Propriedade requerida` se a coluna é `NOT NULL` sem default.

Padrão: listener como ponte fina, regra em método de domínio da entidade (ou em service que recebe a entidade), e só as colunas que a regra mudou voltam ao VO:

```java
@Override
public void beforeInsert(PersistenceEvent event) throws Exception {
    EventEntity<PrxXyzPedido> pedido = EventEntity.fromInsert(event, PrxXyzPedido.class);
    pedido.entity().recalcularValorTotal();
    pedido.writeChanges();
}

@Override
public void beforeUpdate(PersistenceEvent event) throws Exception {
    ModifingFields alterados = event.getModifingFields();
    EventEntity<PrxXyzPedido> pedido = EventEntity.fromUpdate(event, PrxXyzPedido.class);
    if (alterados.isModifingAny("VLRUNIT,QTD")) {
        pedido.entity().recalcularValorTotal();
    }
    pedido.writeChanges(); // so as colunas que a regra mudou
}

@Override
public void afterUpdate(PersistenceEvent event) throws Exception {
    PrxXyzPedido pedido = EventEntity.afterPersist(event, PrxXyzPedido.class);
    pedidoService.notificarAlteracao(pedido);
}
```

Cada evento tem a sua fábrica — a fábrica errada lança a exceção do projeto já no início, dizendo qual usar:

| Evento | Fábrica | Devolve |
|:-------|:--------|:--------|
| `beforeInsert` | `EventEntity.fromInsert(event, Classe)` | `EventEntity<T>` — `entity()` + `writeChanges()` |
| `beforeUpdate` | `EventEntity.fromUpdate(event, Classe)` | `EventEntity<T>` — `entity()` + `writeChanges()` |
| `afterInsert` / `afterUpdate` / `afterDelete` | `EventEntity.afterPersist(event, Classe)` | só a entidade `T` — nada volta ao VO |
| `beforeDelete` | `EntityMapper.fromVO(event.getVo(), Classe)` | a entidade `T` — exclusão não grava VO |

Padrão: todo evento `after*` usa `afterPersist`.

`EventEntity` **não é do SDK** — é classe do projeto, só com API pública do SDK. Implementação de referência:

```java
import br.com.sankhya.jape.event.ModifingFields;
import br.com.sankhya.jape.event.PersistenceEvent;
import br.com.sankhya.jape.vo.DynamicVO;
import br.com.sankhya.jape.vo.EntityVO;
import br.com.sankhya.sdk.data.repository.impl.EntityMapper;
import br.com.sankhya.studio.persistence.Column;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Entidade montada a partir do evento de persistencia. {@link #writeChanges()} devolve ao VO
 * so as colunas que mudaram: gravar a entidade inteira (EntityMapper.updateVO) anularia, no update,
 * as colunas que nao vieram no evento.
 */
public final class EventEntity<T> {

    private final DynamicVO vo;
    private final List<Field> columns;
    private final T original;
    private final T entity;

    private EventEntity(DynamicVO vo, List<Field> columns, T original, T entity) {
        this.vo = vo;
        this.columns = columns;
        this.original = original;
        this.entity = entity;
    }

    /** Para beforeInsert: o VO da inclusao ja traz o registro inteiro. */
    public static <T> EventEntity<T> fromInsert(PersistenceEvent event, Class<T> type) {
        requireType(event, PersistenceEvent.BEFORE_INSERT);
        T original = EntityMapper.fromVO(event.getVo(), type);
        T entity = EntityMapper.fromVO(event.getVo(), type);
        return new EventEntity<T>((DynamicVO) event.getVo(), columns(type), original, entity);
    }

    /** Para beforeUpdate, o unico evento em que o JAPE entrega o registro anterior. */
    public static <T> EventEntity<T> fromUpdate(PersistenceEvent event, Class<T> type)
            throws IllegalAccessException {
        requireType(event, PersistenceEvent.BEFORE_UPDATE);
        List<Field> columns = columns(type);
        EntityVO previous = event.getOldVO();
        ModifingFields modified = event.getModifingFields();
        T original = currentState(previous, modified, type, columns);
        T entity = currentState(previous, modified, type, columns);
        return new EventEntity<T>((DynamicVO) event.getVo(), columns, original, entity);
    }

    /** Para afterInsert, afterUpdate e afterDelete: o registro ja foi gravado e o VO traz o registro completo. */
    public static <T> T afterPersist(PersistenceEvent event, Class<T> type) {
        requireType(event, PersistenceEvent.AFTER_INSERT, PersistenceEvent.AFTER_UPDATE,
                PersistenceEvent.AFTER_DELETE);
        return EntityMapper.fromVO(event.getVo(), type);
    }

    public T entity() {
        return entity;
    }

    /** Chamar so em before*: em after* o registro ja foi gravado. */
    public void writeChanges() throws IllegalAccessException {
        for (Field field : columns) {
            Object before = field.get(original);
            Object after = field.get(entity);
            if (!sameValue(before, after)) {
                Column column = field.getAnnotation(Column.class);
                vo.setProperty(column.name(), EntityMapper.adaptToVo(field, after, column));
            }
        }
    }

    // getOldVO fora do beforeUpdate so acusa com um PersistenceError generico: falha aqui, dizendo qual fabrica usar.
    private static void requireType(PersistenceEvent event, int... types) {
        for (int type : types) {
            if (event.getType() == type) {
                return;
            }
        }
        throw new EventoDePersistenciaInvalidoException("EventEntity: fromInsert vale no beforeInsert, "
                + "fromUpdate no beforeUpdate e afterPersist nos eventos after; evento recebido do tipo "
                + event.getType() + ".");
    }

    private static <T> T currentState(EntityVO previous, ModifingFields modified, Class<T> type,
                                      List<Field> columns) throws IllegalAccessException {
        T state = EntityMapper.fromVO(previous, type);
        for (Field field : columns) {
            String column = field.getAnnotation(Column.class).name();
            if (modified.isModifing(column)) {
                field.set(state, EntityMapper.adaptFromVO(field, modified.getNewValue(column)));
            }
        }
        return state;
    }

    private static List<Field> columns(Class<?> type) {
        List<Field> columns = new ArrayList<Field>();
        for (Field field : type.getDeclaredFields()) {
            if (field.isAnnotationPresent(Column.class)) {
                field.setAccessible(true);
                columns.add(field);
            }
        }
        return columns;
    }

    // BigDecimal compara por valor: 10.0 e 10.00 sao o mesmo valor e nao devem voltar ao VO.
    private static boolean sameValue(Object before, Object after) {
        if (before instanceof BigDecimal && after instanceof BigDecimal) {
            return ((BigDecimal) before).compareTo((BigDecimal) after) == 0;
        }
        return Objects.equals(before, after);
    }
}
```

- Cada fábrica valida `event.getType()` antes de ler o evento: sem isso, `fromUpdate` no `afterUpdate` só quebra no `getOldVO()` com `PersistenceError: Chamada de método válida apenas para eventos 'before-update'`. `EventoDePersistenciaInvalidoException` é exceção do projeto (`extends RuntimeException`) — use a exceção tipada que o projeto já tiver.
- `fromInsert`: `fromVO(event.getVo())`.
- `fromUpdate`: `fromVO(event.getOldVO())` com os valores novos do `ModifingFields` por cima (`EntityMapper.adaptFromVO`) — o estado completo do registro depois do update.
- `writeChanges()`: compara a entidade antes × depois, `@Column` a `@Column`, e grava no VO só o que mudou, convertido por `EntityMapper.adaptToVo` (enum → valor do banco, `Integer` → `BigDecimal`).
- `writeChanges()` só existe em `before*` — `getOldVO()` só existe em `beforeUpdate`. Cobre os `@Column` declarados na própria classe; PK composta (`@Embeddable`) e relacionamentos ficam de fora.
- `afterPersist`: `fromVO(event.getVo())` com o registro completo — em `after*` o registro já foi gravado e nada volta ao VO, por isso devolve só a entidade.
- Teste com `DynamicVOPojo` real, verificando que coluna fora do evento fica intocada — ver skill `test`.
- **Gotcha — tipo do evento em teste:** mock de `PersistenceEvent` devolve `getType() == 0` (`BEFORE_INSERT`), e a fábrica de qualquer outro evento lança a exceção do `requireType`. Stube o tipo do evento que o listener recebe: `when(event.getType()).thenReturn(PersistenceEvent.BEFORE_UPDATE)`.

---

## 8. Injeção de dependência

`@Listener` **suporta `@Inject` (Guice)** — não consta na documentação oficial, mas é suportado pelo SDK. Delegue a regra de negócio a services/use cases injetados via construtor:

```java
@Log
@Listener(instanceNames = "PrxXyzPedido")
public class PrxXyzPedidoListener extends PersistenceEventAdapter {

    private final LimiteCreditoService limiteService;

    @Inject
    public PrxXyzPedidoListener(LimiteCreditoService limiteService) {
        this.limiteService = limiteService;
    }

    @Override
    public void beforeInsert(PersistenceEvent event) throws Exception {
        DynamicVO vo = (DynamicVO) event.getVo();
        // Excecao tipada do service bloqueia a gravacao com mensagem de negocio
        limiteService.validar(vo.asBigDecimalOrZero("CODPARC"), vo.asBigDecimalOrZero("VLRTOT"));
    }
}
```

- `@Inject` de **`com.google.inject.Inject`** — nunca `javax.inject.Inject`.
- Dependências `private final`, injetadas via construtor. Nunca `new` em dependência gerenciada.
- Services/repositories registrados no módulo Guice do projeto (ver `dependency-injection`).

---

## 9. Transação, loops e chamadas externas

O listener roda **dentro da transação da operação**:

- Exceção em `before*` → operação **cancelada** (rollback) e mensagem propagada ao usuário.
- Acesso a banco na mesma transação: use `event.getJdbcWrapper()` ou repositories — **nunca** abra/feche conexão própria.
- **Classe enxuta (boa prática):** o listener filtra o evento e delega a regra para outra classe injetada (ex.: service `@Component`) — a organização em camadas é do projeto.
- **`@Transactional` no service chamado daqui: confira o `TxType`.** O listener já roda dentro da sessão e da transação da operação. `@Transactional` bare (`REQUIRED`, o default) entra nessa transação — caso seguro. `REQUIRES_NEW` suspende a transação da operação e commita por conta própria: se a operação for revertida depois, o que ele gravou fica. `NOT_SUPPORTED` roda fora dela e não participa do commit/rollback. Nada falha na hora — o bug só aparece quando a operação dá erro depois da chamada.
- **Chamada externa síncrona (API HTTP) dentro do listener é PROIBIDA** — segura a transação e derruba o tempo de resposta da gravação. Padrão correto: gravar numa **tabela-fila** e processar via `@Job` ou worker pool assíncrono (fire-and-forget). Efeito que só não pode acontecer se a operação for desfeita, e cuja perda é tolerável: agende para depois do commit (abaixo).

### Efeito externo só depois do commit

HTTP, e-mail ou mensagem disparados dentro do listener saem mesmo que a operação dê rollback depois. O JAPE permite registrar uma tarefa que só roda se a transação commitar:

```java
import br.com.sankhya.jape.core.JapeSession;
import br.com.sankhya.studio.stereotypes.Component;
import com.google.inject.Inject;

/** Roda a tarefa so depois do commit da transacao corrente; em rollback, nao roda. */
@Component
public class AfterCommit {

    @Inject
    public AfterCommit() {
    }

    public void run(Runnable task) throws Exception {
        JapeSession.getCurrentSession().getTopMostHandle().addOnSucessTXTask(task);
    }
}
```

```java
@Override
public void afterUpdate(PersistenceEvent event) throws Exception {
    if (!event.getModifingFields().isModifing("STATUS")) return;
    BigDecimal nuPed = ((DynamicVO) event.getVo()).asBigDecimal("NUPED");
    afterCommit.run(() -> notificacaoService.notificar(nuPed));
}
```

- Grafia da plataforma: `addOnSucessTXTask` ("Sucess"). O par `addOnFailureTXTask` roda quando a transação **não** commita.
- O registro exige transação ativa: fora dela, `IllegalStateException: Não existe uma transação ativa.` No listener sempre há; em controller/job, só dentro de método `@Transactional`.
- A tarefa fica presa à transação corrente. Registrada dentro de um método `REQUIRES_NEW`, roda no commit **dele**, mesmo que a operação externa seja desfeita depois.
- Roda no fim do commit, na mesma thread, com a transação já suspensa — **sem transação**. Para gravar, chame um método `@Transactional(Transactional.TxType.REQUIRES_NEW)`. HTTP lento ali não segura lock, mas ainda atrasa a resposta.
- Exceção na tarefa é logada (`Erro ao executar task de sincronizacao de TX`) e **engolida**: a operação segue commitada, quem chamou não vê o erro e não há retentativa. Trate e logue dentro da tarefa. Entrega que não pode se perder continua sendo tabela-fila + `@Job`.

### Loop de eventos

Listener que grava **na própria instância que escuta** (direta ou indiretamente via service) dispara os eventos de novo → loop infinito. **Sempre** proteja com guard clause de estado:

```java
@Override
public void afterUpdate(PersistenceEvent event) throws Exception {
    DynamicVO vo = (DynamicVO) event.getVo();
    // O service muda o STATUS do proprio registro — sem este guard,
    // o update do service dispararia este afterUpdate de novo (loop)
    if (!"P".equals(vo.asString("STATUS"))) return;
    processamentoService.processar(vo.asBigDecimal("NUPED"));
}
```

> **Flag de sessão temporária como guard:** `JapeSession.scopedState`/`saveState`/`restoreState` só existem nas versões mais recentes do jape — se o build não os acha (`cannot find symbol`), use `JapeSession.putProperty` antes e `removeProperty` (ou o valor anterior de volta) num `finally`.

---

## 10. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                                        | Correção                                                              |
|:---------------------------------------------------------------------|:-----------------------------------------------------------------------|
| Usar `getVo()` sem cast                                             | `(DynamicVO) event.getVo()`                                           |
| Update sem filtrar por `getModifingFields().isModifing(...)`        | Filtrar campo alterado — listener dispara em **qualquer** update      |
| Ler campo não alterado do VO em update esperando valor              | VO do `beforeUpdate` só traz o delta — use `getOldVO()` ali; em `after*` o VO vem completo: `EventEntity.afterPersist` |
| Chamada HTTP/API externa síncrona no listener                       | Tabela-fila + `@Job`/worker assíncrono                                |
| Gravar na própria instância sem guard clause de estado              | Guard clause anti-loop (ver §9)                                       |
| Abrir/fechar conexão JDBC própria                                   | `event.getJdbcWrapper()` — nunca fechar                               |
| Alterar VO em `after*` esperando persistir                          | Alterações persistem só em `before*`                                  |
| `throw new RuntimeException(...)` cru para bloquear operação        | Exceção tipada com mensagem de negócio                                |
| `new` em dependência gerenciada                                     | `@Inject` via construtor (Guice)                                      |
| `@Inject` de `javax.inject`                                         | Usar `com.google.inject.Inject`                                       |
| `System.out` / SLF4J para log                                       | `@Log` Lombok + `java.util.logging`                                   |
| Import `br.com.sankhya.jape.util.JdbcWrapper`                       | Pacote correto: `br.com.sankhya.jape.dao.JdbcWrapper`                 |
| `EntityMapper.updateVO` da entidade inteira em `beforeUpdate`        | Gravar só as colunas que a regra mudou (`EventEntity`, ver §7)        |

---

## 11. Checklist: Novo `@Listener`

1. [ ] Classe estende `br.com.sankhya.jape.event.PersistenceEventAdapter` e sobrescreve **só** os eventos necessários.
2. [ ] Anotada com `@Listener(instanceNames = "<NomeDaInstancia>")` — nome lógico da entidade, **não** a tabela; array para múltiplas instâncias.
3. [ ] `getVo()` com cast para `DynamicVO`.
4. [ ] `beforeUpdate`/`afterUpdate` filtram por `getModifingFields().isModifing(...)`.
5. [ ] Alteração de campos só em `before*` via `vo.setProperty(...)` — sem save manual.
6. [ ] Bloqueio de operação via exceção tipada em `before*`, mensagem de negócio.
7. [ ] Regra de negócio delegada a service/use case via `@Inject` construtor (Guice).
8. [ ] Sem chamada externa síncrona — tabela-fila + `@Job`/worker se precisar integrar.
9. [ ] Guard clause anti-loop se o listener (ou quem ele chama) grava na própria instância.
10. [ ] `@Log` Lombok para logging (`java.util.logging`).
11. [ ] Regra na entidade tipada em `beforeUpdate`: estado completo via `getOldVO()` + `ModifingFields`, e só as colunas alteradas voltam ao VO — nunca `updateVO` da entidade inteira (ver §7).

## Skills relacionadas

- `entity` — entidade `@JapeEntity` alvo do listener; `EntityMapper.fromVO` converte VO → entidade
- `repository` — recarregar registro completo pela PK quando o VO do `beforeUpdate` só traz o delta
- `before-load-listener` — interceptação de **leitura** (escopo distinto: busca, não CRUD)
- `business-rule` — hook transacional do barramento comercial (notas)
- `job` — processamento assíncrono da tabela-fila alimentada pelo listener
- `dependency-injection` — wiring Guice dos services/use cases injetados
- `test` — JUnit + Mockito dos métodos de evento
