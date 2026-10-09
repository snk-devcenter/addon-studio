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

    // VO do update so traz os campos alterados: o que nao mudou vem do registro anterior
    private static BigDecimal valorAtual(PersistenceEvent event, String campo) {
        EntityVO origem = event.getModifingFields().isModifing(campo) ? event.getVo() : event.getOldVO();
        return ((DynamicVO) origem).asBigDecimalOrZero(campo);
    }
}
```

- Classe **estende** `br.com.sankhya.jape.event.PersistenceEventAdapter` e sobrescreve só os eventos de interesse.
- Listener é **entrypoint fino**: filtra o evento, manipula o `DynamicVO` e **delega a regra de negócio** a service/use case injetado.
- No update o VO do evento só traz PK + campos alterados — **não** reaproveite o `beforeInsert` lendo o VO: campo não alterado viria `null` (zero no cálculo). Valor atual = novo se alterado, senão `getOldVO()`. Regra na entidade tipada: §7.

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

> `fromVO(event.getVo())` monta a entidade com **o que veio no VO**: completa no insert, só PK + delta no update. Para ler e **alterar** a entidade em `beforeUpdate` e devolver ao VO, ver §7 — `EntityMapper.updateVO` ali apaga dados.

---

## 6. `ModifingFields` — filtrar updates por campo alterado

`beforeUpdate`/`afterUpdate` disparam em **qualquer** update da instância — e o evento de update **só traz os campos alterados** no VO. Filtre pelo que mudou:

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

> **Gotcha:** no update, `vo.getProperty("CAMPO")` de campo **não alterado** pode vir `null` — o VO do evento só carrega o delta. Precisa do registro completo em `after*`? Leia a PK do VO e recarregue via repository/use case.

> **Gotchas do `ModifingFields`:**
> - `getOldValue("CAMPO")` de campo **não alterado** **não** devolve o valor anterior: devolve `getProperty` do próprio VO do evento (o mesmo delta de `getVo()`), que pode vir `null`. Estado anterior completo: `event.getOldVO()`.
> - `getNewValue("CAMPO")` de campo não alterado lança `IllegalStateException` — cheque `isModifing("CAMPO")` antes.
> - `getModifingFields()` fora de `beforeUpdate`/`afterUpdate` e `getOldVO()` fora de `beforeUpdate` lançam `PersistenceError`.
> - Em teste, **não** use mock de `ModifingFields`: stub de `isModifing` não alimenta `isModifingAny` (devolve `false`) e o teste passa sem exercitar o filtro. Use a instância real — ver skill `test`.

---

## 7. Regra na entidade tipada, não no `DynamicVO`

O SDK converte nos dois sentidos: `EntityMapper.fromVO(EntityVO, Classe)` (VO → entidade) e `EntityMapper.updateVO(entidade, vo, Classe)` (entidade → VO). O par `fromVO` + regra + `updateVO` é seguro em `beforeInsert` — o VO da inclusão traz o registro inteiro — e **apaga dados em `beforeUpdate`**:

- O VO do update só traz PK + campos alterados; os demais `@Column` chegam `null` na entidade.
- `updateVO` grava **todo** `@Column` no VO, inclusive `null`. Não há rastreio de alteração para `@Column`.
- O JAPE decide o que mudou **comparando valores** (VO × registro no banco): campo que não veio no evento é ignorado, mas campo que voltou `null` conta como alterado para nulo. As colunas fora do evento são anuladas — ou o update falha com `Propriedade requerida` se a coluna é `NOT NULL` sem default.

Padrão: listener como ponte fina, regra em método de domínio da entidade (ou em service que recebe a entidade), e só as colunas que a regra mudou voltam ao VO:

```java
@Override
public void beforeInsert(PersistenceEvent event) throws Exception {
    EntidadeDoEvento<PrxXyzPedido> evento = EntidadeDoEvento.daInclusao(event, PrxXyzPedido.class);
    evento.entidade().recalcularValorTotal();
    evento.gravarAlteracoes();
}

@Override
public void beforeUpdate(PersistenceEvent event) throws Exception {
    ModifingFields alterados = event.getModifingFields();
    EntidadeDoEvento<PrxXyzPedido> evento = EntidadeDoEvento.daAlteracao(event, PrxXyzPedido.class);
    if (alterados.isModifingAny("VLRUNIT,QTD")) {
        evento.entidade().recalcularValorTotal();
    }
    evento.gravarAlteracoes(); // so as colunas que a regra mudou
}
```

`EntidadeDoEvento` **não é do SDK** — é classe do projeto, só com API pública do SDK. Implementação de referência:

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
 * Entidade montada a partir do evento de persistencia. {@link #gravarAlteracoes()} devolve ao VO
 * so as colunas que mudaram: gravar a entidade inteira (EntityMapper.updateVO) anularia, no update,
 * as colunas que nao vieram no evento.
 */
public final class EntidadeDoEvento<T> {

    private final DynamicVO vo;
    private final List<Field> colunas;
    private final T original;
    private final T entidade;

    private EntidadeDoEvento(DynamicVO vo, List<Field> colunas, T original, T entidade) {
        this.vo = vo;
        this.colunas = colunas;
        this.original = original;
        this.entidade = entidade;
    }

    /** Para beforeInsert: o VO da inclusao ja traz o registro inteiro. */
    public static <T> EntidadeDoEvento<T> daInclusao(PersistenceEvent evento, Class<T> tipo) {
        T original = EntityMapper.fromVO(evento.getVo(), tipo);
        T entidade = EntityMapper.fromVO(evento.getVo(), tipo);
        return new EntidadeDoEvento<T>((DynamicVO) evento.getVo(), colunas(tipo), original, entidade);
    }

    /** Para beforeUpdate, o unico evento em que o JAPE entrega o registro anterior. */
    public static <T> EntidadeDoEvento<T> daAlteracao(PersistenceEvent evento, Class<T> tipo)
            throws IllegalAccessException {
        List<Field> colunas = colunas(tipo);
        EntityVO anterior = evento.getOldVO();
        ModifingFields alterados = evento.getModifingFields();
        T original = estadoAtual(anterior, alterados, tipo, colunas);
        T entidade = estadoAtual(anterior, alterados, tipo, colunas);
        return new EntidadeDoEvento<T>((DynamicVO) evento.getVo(), colunas, original, entidade);
    }

    public T entidade() {
        return entidade;
    }

    /** Chamar so em before*: em after* o registro ja foi gravado. */
    public void gravarAlteracoes() throws IllegalAccessException {
        for (Field campo : colunas) {
            Object antes = campo.get(original);
            Object depois = campo.get(entidade);
            if (!mesmoValor(antes, depois)) {
                Column coluna = campo.getAnnotation(Column.class);
                vo.setProperty(coluna.name(), EntityMapper.adaptToVo(campo, depois, coluna));
            }
        }
    }

    private static <T> T estadoAtual(EntityVO anterior, ModifingFields alterados, Class<T> tipo,
                                     List<Field> colunas) throws IllegalAccessException {
        T estado = EntityMapper.fromVO(anterior, tipo);
        for (Field campo : colunas) {
            String coluna = campo.getAnnotation(Column.class).name();
            if (alterados.isModifing(coluna)) {
                campo.set(estado, EntityMapper.adaptFromVO(campo, alterados.getNewValue(coluna)));
            }
        }
        return estado;
    }

    private static List<Field> colunas(Class<?> tipo) {
        List<Field> colunas = new ArrayList<Field>();
        for (Field campo : tipo.getDeclaredFields()) {
            if (campo.isAnnotationPresent(Column.class)) {
                campo.setAccessible(true);
                colunas.add(campo);
            }
        }
        return colunas;
    }

    // BigDecimal compara por valor: 10.0 e 10.00 sao o mesmo valor e nao devem voltar ao VO.
    private static boolean mesmoValor(Object antes, Object depois) {
        if (antes instanceof BigDecimal && depois instanceof BigDecimal) {
            return ((BigDecimal) antes).compareTo((BigDecimal) depois) == 0;
        }
        return Objects.equals(antes, depois);
    }
}
```

- `daInclusao`: `fromVO(event.getVo())`.
- `daAlteracao`: `fromVO(event.getOldVO())` com os valores novos do `ModifingFields` por cima (`EntityMapper.adaptFromVO`) — o estado completo do registro depois do update.
- `gravarAlteracoes()`: compara a entidade antes × depois, `@Column` a `@Column`, e grava no VO só o que mudou, convertido por `EntityMapper.adaptToVo` (enum → valor do banco, `Integer` → `BigDecimal`).
- Só em `before*` — `getOldVO()` só existe em `beforeUpdate`. Cobre os `@Column` declarados na própria classe; PK composta (`@Embeddable`) e relacionamentos ficam de fora.
- Em `after*` nada volta ao VO: `fromVO(event.getVo())` basta para ler a PK e recarregar pelo repository.
- Teste com `DynamicVOPojo` real, verificando que coluna fora do evento fica intocada — ver skill `test`.

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
- **Chamada externa síncrona (API HTTP) dentro do listener é PROIBIDA** — segura a transação e derruba o tempo de resposta da gravação. Padrão correto: gravar numa **tabela-fila** e processar via `@Job` ou worker pool assíncrono (fire-and-forget).

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

---

## 10. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                                        | Correção                                                              |
|:---------------------------------------------------------------------|:-----------------------------------------------------------------------|
| Usar `getVo()` sem cast                                             | `(DynamicVO) event.getVo()`                                           |
| Update sem filtrar por `getModifingFields().isModifing(...)`        | Filtrar campo alterado — listener dispara em **qualquer** update      |
| Ler campo não alterado do VO em update esperando valor              | VO de update só traz o delta — `getOldVO()` em `beforeUpdate`; recarregar pela PK em `after*` |
| Chamada HTTP/API externa síncrona no listener                       | Tabela-fila + `@Job`/worker assíncrono                                |
| Gravar na própria instância sem guard clause de estado              | Guard clause anti-loop (ver §9)                                       |
| Abrir/fechar conexão JDBC própria                                   | `event.getJdbcWrapper()` — nunca fechar                               |
| Alterar VO em `after*` esperando persistir                          | Alterações persistem só em `before*`                                  |
| `throw new RuntimeException(...)` cru para bloquear operação        | Exceção tipada com mensagem de negócio                                |
| `new` em dependência gerenciada                                     | `@Inject` via construtor (Guice)                                      |
| `@Inject` de `javax.inject`                                         | Usar `com.google.inject.Inject`                                       |
| `System.out` / SLF4J para log                                       | `@Log` Lombok + `java.util.logging`                                   |
| Import `br.com.sankhya.jape.util.JdbcWrapper`                       | Pacote correto: `br.com.sankhya.jape.dao.JdbcWrapper`                 |
| `EntityMapper.updateVO` da entidade inteira em `beforeUpdate`        | Gravar só as colunas que a regra mudou (`EntidadeDoEvento`, ver §7)   |

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
- `repository` — recarregar registro completo pela PK quando o VO do evento só traz o delta
- `before-load-listener` — interceptação de **leitura** (escopo distinto: busca, não CRUD)
- `business-rule` — hook transacional do barramento comercial (notas)
- `job` — processamento assíncrono da tabela-fila alimentada pelo listener
- `dependency-injection` — wiring Guice dos services/use cases injetados
- `test` — JUnit + Mockito dos métodos de evento
