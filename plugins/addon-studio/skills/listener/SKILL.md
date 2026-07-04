---
name: listener
description: Cria, revisa e padroniza listeners de persistência Sankhya com `@Listener` (classe estende `PersistenceEventAdapter`) — reage a eventos CRUD (before/after insert, update, delete) de qualquer entidade JAPE, inclusive instâncias nativas. Use ao criar, alterar, revisar, auditar ou padronizar reação a gravação/exclusão de registros, ao validar ou preencher campos automaticamente no insert/update, ao implementar auditoria de alterações, ao reagir a mudança de status de um registro, ao bloquear operações com exceção em `before*`, ao trabalhar com classes `*Listener` de persistência, ou ao tocar em código com `@Listener`/`PersistenceEventAdapter`/`PersistenceEvent`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Listener de Persistência (`@Listener`) — Addon Studio 2.0

`@Listener` executa lógica personalizada **em eventos de persistência (CRUD) de uma entidade JAPE** — antes/depois de insert, update e delete. Funciona em entidades do próprio add-on **e em instâncias nativas do sistema** (`CabecalhoNota`, `Parceiro`, `Produto`, etc.). A anotação registra o listener automaticamente — **sem edição manual de XML**.

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
import br.com.sankhya.studio.annotations.Listener;
import com.google.inject.Inject;
import lombok.extern.java.Log;

import java.math.BigDecimal;

@Log
@Listener(instanceNames = "TdcXyzPedido")
public class TdcXyzPedidoListener extends PersistenceEventAdapter {

    private final CalculoPedidoService calculoService;

    @Inject
    public TdcXyzPedidoListener(CalculoPedidoService calculoService) {
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
        if (event.getModifingFields().isModifing("VLRUNIT")
                || event.getModifingFields().isModifing("QTD")) {
            beforeInsert(event);
        }
    }
}
```

- Classe **estende** `br.com.sankhya.jape.event.PersistenceEventAdapter` e sobrescreve só os eventos de interesse.
- Listener é **entrypoint fino**: filtra o evento, manipula o `DynamicVO` e **delega a regra de negócio** a service/use case injetado.

---

## 3. Atributo da anotação `@Listener`

| Atributo        | Tipo       | Obrigatório | Descrição                                                                                   |
|:----------------|:-----------|:------------|:----------------------------------------------------------------------------------------------|
| `instanceNames` | `String[]` | Sim         | Nome(s) da(s) **instância(s)** a escutar — o mesmo valor de `@JapeEntity(entity = "...")`, de `<instance name="...">` no XML, ou o nome da instância nativa. **Não** é o nome da tabela. |

```java
@Listener(instanceNames = "TdcXyzPedido")                        // uma instancia
@Listener(instanceNames = {"CabecalhoNota", "Financeiro"})       // varias instancias (nativas)
```

> **Gotcha:** `instanceNames` é o **nome lógico da entidade**, não a tabela. Para `@JapeEntity(entity = "TdcXyzPedido", table = "TDCXYZPED")`, usa-se `@Listener(instanceNames = "TdcXyzPedido")`.

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
| `getOldVO()`            | `EntityVO`                                     | Dados **antes** da modificação (updates).                                  |
| `getModifingFields()`   | `ModifingFields`                               | Quais campos estão sendo alterados (updates) — ver §6.                     |
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

TdcXyzPedido pedido = EntityMapper.fromVO(event.getVo(), TdcXyzPedido.class);
if (!pedido.deveProcessar()) return;  // regra de dominio na entidade, nao no listener
```

---

## 6. `ModifingFields` — filtrar updates por campo alterado

`beforeUpdate`/`afterUpdate` disparam em **qualquer** update da instância — e o evento de update **só traz os campos alterados** no VO. Filtre pelo que mudou:

| Método                        | Uso                                                            |
|:-------------------------------|:-----------------------------------------------------------------|
| `isModifing("CAMPO")`         | `true` se o campo está sendo alterado neste update.             |
| `isModifingAny("C1,C2")`      | `true` se qualquer um dos campos está sendo alterado.           |
| `getOldValue("CAMPO")`        | Valor anterior do campo.                                        |
| `getNewValue("CAMPO")`        | Valor novo do campo.                                            |

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

---

## 7. Injeção de dependência

`@Listener` **suporta `@Inject` (Guice)** — não consta na documentação oficial, mas é suportado pelo SDK. Delegue a regra de negócio a services/use cases injetados via construtor:

```java
@Log
@Listener(instanceNames = "TdcXyzFilaEnvio")
public class TdcXyzFilaEnvioListener extends PersistenceEventAdapter {

    private final EnvioWorkerPool workerPool;

    @Inject
    public TdcXyzFilaEnvioListener(EnvioWorkerPool workerPool) {
        this.workerPool = workerPool;
    }

    @Override
    public void afterInsert(PersistenceEvent event) throws Exception {
        TdcXyzFilaEnvio fila = EntityMapper.fromVO(event.getVo(), TdcXyzFilaEnvio.class);
        if (!fila.isPendente()) return;   // guard clause anti-loop — ver §8
        workerPool.submeter(fila);        // fire-and-forget, nao bloqueia a transacao
    }
}
```

- `@Inject` de **`com.google.inject.Inject`** — nunca `javax.inject.Inject`.
- Dependências `private final`, injetadas via construtor. Nunca `new` em dependência gerenciada.
- Services/repositories registrados no módulo Guice do projeto (ver `dependency-injection`).

---

## 8. Transação, loops e chamadas externas

O listener roda **dentro da transação da operação**:

- Exceção em `before*` → operação **cancelada** (rollback) e mensagem propagada ao usuário.
- Acesso a banco na mesma transação: use `event.getJdbcWrapper()` ou repositories — **nunca** abra/feche conexão própria.
- **Chamada externa síncrona (API HTTP) dentro do listener é PROIBIDA** — segura a transação e derruba o tempo de resposta da gravação. Padrão correto: gravar numa **tabela-fila** e processar via `@Job` ou worker pool assíncrono (fire-and-forget).

### Loop de eventos

Listener que grava **na própria instância que escuta** (direta ou indiretamente via service) dispara os eventos de novo → loop infinito. **Sempre** proteja com guard clause de estado:

```java
@Override
public void afterUpdate(PersistenceEvent event) throws Exception {
    TdcXyzFilaEnvio fila = EntityMapper.fromVO(event.getVo(), TdcXyzFilaEnvio.class);
    // Worker atualiza STATUS para PROCESSANDO/PROCESSADO/ERRO — sem este filtro,
    // cada update do worker dispararia o afterUpdate de novo (loop)
    if (!fila.isPendente()) return;
    workerPool.submeter(fila);
}
```

---

## 9. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                                        | Correção                                                              |
|:---------------------------------------------------------------------|:-----------------------------------------------------------------------|
| Regra de negócio dentro do listener                                 | Listener filtra evento e delega a service/use case injetado           |
| Usar `getVo()` sem cast                                             | `(DynamicVO) event.getVo()`                                           |
| Update sem filtrar por `getModifingFields().isModifing(...)`        | Filtrar campo alterado — listener dispara em **qualquer** update      |
| Ler campo não alterado do VO em update esperando valor              | VO de update só traz o delta — recarregar pela PK se precisar do todo |
| Chamada HTTP/API externa síncrona no listener                       | Tabela-fila + `@Job`/worker assíncrono                                |
| Gravar na própria instância sem guard clause de estado              | Guard clause anti-loop (ver §8)                                       |
| Abrir/fechar conexão JDBC própria                                   | `event.getJdbcWrapper()` — nunca fechar                               |
| Alterar VO em `after*` esperando persistir                          | Alterações persistem só em `before*`                                  |
| `throw new RuntimeException(...)` cru para bloquear operação        | Exceção tipada com mensagem de negócio                                |
| `new` em dependência gerenciada                                     | `@Inject` via construtor (Guice)                                      |
| `@Inject` de `javax.inject`                                         | Usar `com.google.inject.Inject`                                       |
| `System.out` / SLF4J para log                                       | `@Log` Lombok + `java.util.logging`                                   |
| Import `br.com.sankhya.jape.util.JdbcWrapper`                       | Pacote correto: `br.com.sankhya.jape.dao.JdbcWrapper`                 |

---

## 10. Checklist: Novo `@Listener`

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

## Skills relacionadas

- `entity` — entidade `@JapeEntity` alvo do listener; `EntityMapper.fromVO` converte VO → entidade
- `repository` — recarregar registro completo pela PK quando o VO do evento só traz o delta
- `before-load-listener` — interceptação de **leitura** (escopo distinto: busca, não CRUD)
- `business-rule` — hook transacional do barramento comercial (notas)
- `job` — processamento assíncrono da tabela-fila alimentada pelo listener
- `dependency-injection` — wiring Guice dos services/use cases injetados
- `test` — JUnit + Mockito dos métodos de evento
