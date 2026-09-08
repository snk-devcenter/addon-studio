---
name: callback
description: Cria, revisa e refatora callbacks de documento Sankhya com `@Callback` (`ICustomCallBack` + `CallbackWhen` + `CallbackEvent`) — hooks que a plataforma dispara na inclusão/alteração do cabeçalho da nota, na confirmação pela Central de Vendas, na confirmação pelo Portal de Vendas e no faturamento em lote do portal. Use ao criar, alterar, revisar, auditar ou padronizar lógica que roda antes ou depois de confirmar documento comercial (pedido, nota de venda e também **nota de entrada/compra**), ao gerar ou emitir documento auxiliar antes da confirmação, ao abortar a confirmação com exceção, ao reagir ao resultado da confirmação inclusive quando ela falhou, ao interceptar inclusão/alteração de cabeçalho vinda dos portais ou de integração, ao interceptar o faturamento em lote no portal, ao trabalhar com classes `*Callback.java`, ou ao tocar em código com `@Callback`/`ICustomCallBack`. É também a skill de quem precisa descobrir **qual** `CallbackEvent` corresponde à tela: Central e Portal disparam eventos diferentes, e o par `when`/`event` errado compila, sobe e nunca dispara. NÃO usar quando a regra é do barramento comercial de nota de saída pela interface `Regra` + `ContextoRegra` (liberação de limite de crédito) — isso é `@BusinessRule`, skill `business-rule`. NÃO usar para evento CRUD de entidade JAPE (`PersistenceEventAdapter`) — isso é `@Listener`, skill `listener`; inclusão de documento pelos portais **não** passa por CRUD JAPE. NÃO usar para rotina disparada por clique do usuário na grade (`AcaoRotinaJava`) — isso é `action-button`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Callback de Documento (`@Callback`) — Addon Studio 2.0

`@Callback` registra uma classe em **pontos fixos do ciclo de vida do `CabecalhoNota`** que a plataforma já dispara: inclusão/alteração do cabeçalho, confirmação (Central e Portal) e faturamento em lote. A anotação basta — **sem edição manual de XML nem de parâmetro**.

Diferente de `@BusinessRule`, vale para **qualquer** documento comercial, incluindo **Notas de Entrada (compras)**.

> ⚠️ **A pegadinha central: Central e Portal são eventos diferentes.** `PROCESS_CONFIRMATION` é a confirmação da Central de Vendas; `CONFIRMATION` é a confirmação do Portal de Vendas. Uma classe carrega **um** par `when`/`event` — `@Callback` não é repetível. Para valer nas duas telas: classe base compartilhada + uma subclasse por evento (seção 7).

> **Referências complementares:**
> - `business-rule` — barramento comercial de nota de saída
> - `dependency-injection` — injeção de dependência (Guice)

---

## 1. Quando usar — `@Callback` vs `@BusinessRule` vs `@Listener`

| Mecanismo       | Escopo                                                          | Quando usar                                                                                     |
|:----------------|:----------------------------------------------------------------|:------------------------------------------------------------------------------------------------|
| `@Callback`     | Ponto fixo do ciclo do documento: cabeçalho, confirmação, faturamento — **todos** os documentos, inclusive Notas de Entrada | Interceptar a confirmação em si (antes/depois), gerar documento auxiliar, abortar a confirmação, reagir ao faturamento em lote. |
| `@BusinessRule` | Notas de Saída e Mov. Interna, via barramento (`ContextoRegra`)  | Regra que precisa do barramento: liberação de limite, validação complexa na confirmação/faturamento de venda. |
| `@Listener`     | CRUD (insert/update/delete) de qualquer entidade JAPE           | Validar/preencher campo ao gravar/excluir registro; auditoria.                                  |

**Regra rápida:**
- Validar/emitir algo na confirmação de nota de compra? `@Callback`.
- Liberação de limite em nota de venda? `@BusinessRule`.
- Lógica ao salvar/excluir registro de tabela? `@Listener`.

> `CallbackEvent.INSERTION` **não** substitui `@Listener`: ele dispara na inclusão/alteração de documento pelos portais e por integração, e não em evento CRUD do JAPE.

---

## 2. Anatomia

```java
import br.com.sankhya.modelcore.comercial.proxyconnect.IBarramentoRegra;
import br.com.sankhya.modelcore.custommodule.ICustomCallBack;
import br.com.sankhya.studio.annotations.hooks.Callback;
import br.com.sankhya.studio.annotations.hooks.CallbackEvent;
import br.com.sankhya.studio.annotations.hooks.CallbackWhen;
import com.google.inject.Inject;
import java.math.BigDecimal;
import java.util.Map;

@Callback(
    when = CallbackWhen.BEFORE,
    event = CallbackEvent.PROCESS_CONFIRMATION,
    description = "Emite o laudo antes da confirmacao na Central de Vendas"
)
public class EmissaoLaudoCentralCallback implements ICustomCallBack {

    private final LaudoService laudoService;

    @Inject
    public EmissaoLaudoCentralCallback(LaudoService laudoService) {
        this.laudoService = laudoService;
    }

    @Override
    public Object call(String id, Map<String, Object> data) {
        BigDecimal nuNota = (BigDecimal) data.get("nunota");
        IBarramentoRegra bRegras = (IBarramentoRegra) data.get("bregras");

        laudoService.emitir(nuNota);
        bRegras.addMensagem("Laudo emitido automaticamente.");

        return null;
    }
}
```

`call` **não declara `throws`** — a interface não permite. Exceção que aborta a operação tem que ser unchecked (seção 8).

---

## 3. Atributos da anotação `@Callback`

| Atributo      | Obrigatório | Descrição                                                                                          |
|:--------------|:------------|:---------------------------------------------------------------------------------------------------|
| `when`        | Sim         | `CallbackWhen.BEFORE` ou `CallbackWhen.AFTER`.                                                     |
| `event`       | Sim         | O ponto do ciclo do documento — `CallbackEvent`, seção 4.                                          |
| `description` | Sim         | Descrição legível. Aparece na listagem de personalizações do ambiente e nas mensagens de telemetria do evento — é o texto que o suporte lê para saber quem interceptou a confirmação. |

Os três são obrigatórios: omitir qualquer um quebra o build com `O atributo '<x>' é obrigatório em anotações @Callback`.

---

## 4. `CallbackEvent` — qual evento é qual tela

| `event`                | `when` disponível  | Dispara em                                                                                   | Origem prática             |
|:-----------------------|:-------------------|:---------------------------------------------------------------------------------------------|:---------------------------|
| `INSERTION`            | `BEFORE`, `AFTER`  | Inclusão/alteração do cabeçalho do documento pelos portais ou por integração.                | Portais, integração        |
| `PROCESS_CONFIRMATION` | `BEFORE`, `AFTER`  | Processamento da confirmação do documento.                                                   | **Central de Vendas**      |
| `CONFIRMATION`         | `BEFORE`, `AFTER`  | Confirmação que gera o lote de documentos eletrônicos.                                       | **Portal de Vendas**       |
| `PROCESS_BILLING`      | **só `BEFORE`**    | Início do faturamento em lote, após o parse da requisição e antes de faturar.                | Portal (faturamento)       |

`PROCESS_BILLING` + `AFTER` **não existe**: quebra o build com `Combinação de tipo e apresentação desconhecida: Evento = PROCESS_BILLING e Execução = AFTER`.

---

## 5. `CallbackWhen` — o que cada momento permite

| `when`   | Roda                                                    | Serve para                                                                                  |
|:---------|:--------------------------------------------------------|:--------------------------------------------------------------------------------------------|
| `BEFORE` | Antes do corpo da operação, na transação do documento.  | Validar e **abortar** (exceção), preparar dado, emitir documento auxiliar que a operação exige. |
| `AFTER`  | Ao final da operação — **inclusive quando ela falhou**. | Reagir ao resultado, disparar integração, registrar histórico. Comece checando `error`.     |

`AFTER` **não é pós-commit**: ainda está dentro do fluxo (e da transação) da operação. Efeito colateral externo vai em mecanismo assíncrono, como em `@BusinessRule`.

---

## 6. Contrato `ICustomCallBack` — o que vem no `data`

```java
public Object call(String id, Map<String, Object> data)
```

- `id` — identificador do evento disparado (ex. `central.processarConfirmacao.before`). Útil para uma classe base logar ou ramificar por origem.
- `data` — mapa de dados do evento. Chaves e tipos **por evento**, abaixo.
- retorno — **descartado** pela plataforma em todos os pontos de documento. Use `return null`.

| `event`                | `when`   | Chaves de `data`                                                                                                                                            |
|:-----------------------|:---------|:------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `INSERTION`            | `BEFORE` | `cabState` → `PrePersistEntityState`                                                                                                                        |
| `INSERTION`            | `AFTER`  | `cabState` → `PrePersistEntityState`; `oldCabVO` → `DynamicVO` (nulo na inclusão); `bRegras` → `IBarramentoRegra`                                            |
| `PROCESS_CONFIRMATION` | `BEFORE` | `nunota` → `BigDecimal`; `bregras` → `IBarramentoRegra`                                                                                                     |
| `PROCESS_CONFIRMATION` | `AFTER`  | `nunota` → `BigDecimal`; `bregras` → `IBarramentoRegra`; `cab_state` → `PrePersistEntityState` (nulo se falhou antes de confirmar); `error` → `Exception` ou nulo |
| `CONFIRMATION`         | `BEFORE` | `nunota` → `BigDecimal`; `bregras` → `IBarramentoRegra`                                                                                                     |
| `CONFIRMATION`         | `AFTER`  | `nunota` → `BigDecimal`; `bregras` → `IBarramentoRegra`; `error` → `Exception` ou nulo                                                                       |
| `PROCESS_BILLING`      | `BEFORE` | `notasSelecao` → `Collection<BigDecimal>`; `itensEditados` → `Map<String, BigDecimal>` (chave `"<nunota>-<sequencia>"`, valor = quantidade a faturar)         |

> ⚠️ **A chave do barramento muda de grafia entre eventos**: `bregras` minúsculo nos eventos de confirmação, `bRegras` camelCase no `INSERTION` `AFTER`. Errar a grafia devolve `null` silencioso e o NPE aparece só em runtime, na confirmação do cliente.

Imports dos tipos do `data`:

```java
import br.com.sankhya.jape.vo.DynamicVO;
import br.com.sankhya.jape.vo.PrePersistEntityState;
import br.com.sankhya.modelcore.comercial.proxyconnect.IBarramentoRegra;
```

`IBarramentoRegra` expõe, entre outros, `addMensagem(String)`, `addImpressaoSolicitada(...)`, `addILiberacaoSolicitada(...)`, `getState()` e `getErros()`.

---

## 7. Central **e** Portal: classe base + uma subclasse por evento

Uma classe = um par `when`/`event`. Para a mesma lógica valer nas duas telas, a lógica fica na base e cada subclasse carrega uma anotação:

```java
// Base — sem @Callback, nao e registrada
public abstract class ConfirmacaoDocumentoCallback implements ICustomCallBack {

    private final LaudoService laudoService;

    protected ConfirmacaoDocumentoCallback(LaudoService laudoService) {
        this.laudoService = laudoService;
    }

    @Override
    public Object call(String id, Map<String, Object> data) {
        BigDecimal nuNota = (BigDecimal) data.get("nunota");
        IBarramentoRegra bRegras = (IBarramentoRegra) data.get("bregras");

        laudoService.emitir(nuNota);
        bRegras.addMensagem("Laudo emitido automaticamente.");

        return null;
    }
}
```

```java
@Callback(
    when = CallbackWhen.BEFORE,
    event = CallbackEvent.PROCESS_CONFIRMATION,
    description = "Emite o laudo antes da confirmacao na Central de Vendas"
)
public class ConfirmacaoCentralCallback extends ConfirmacaoDocumentoCallback {

    @Inject
    public ConfirmacaoCentralCallback(LaudoService laudoService) {
        super(laudoService);
    }
}
```

```java
@Callback(
    when = CallbackWhen.BEFORE,
    event = CallbackEvent.CONFIRMATION,
    description = "Emite o laudo antes da confirmacao no Portal de Vendas"
)
public class ConfirmacaoPortalCallback extends ConfirmacaoDocumentoCallback {

    @Inject
    public ConfirmacaoPortalCallback(LaudoService laudoService) {
        super(laudoService);
    }
}
```

O `@Inject` precisa estar no construtor da **subclasse concreta** — é ela que o Guice instancia.

---

## 8. Semântica transacional

- **`BEFORE` aborta.** Roda antes do corpo da operação, na mesma thread e na mesma transação do documento: exceção lançada cancela a confirmação e reverte a transação.
- **A exceção é reembrulhada.** A plataforma captura qualquer exceção do callback e a relança como `IllegalStateException`, com a original na causa. Não conte com sua mensagem aparecendo crua na tela — para aviso **não** bloqueante, use `bRegras.addMensagem(...)` em vez de exceção.
- **`call` não declara `throws`.** Para abortar, lance unchecked — `IllegalStateException` ou uma `RuntimeException` do add-on. Exceção checada (`MGEModelException`, `Exception`) precisa ser embrulhada antes.
- **`AFTER` dispara mesmo no erro.** Se a operação falhou, `data.get("error")` traz a exceção e a plataforma a relança logo depois do callback. Todo `AFTER` de confirmação começa checando `error`:

```java
@Override
public Object call(String id, Map<String, Object> data) {
    Exception erro = (Exception) data.get("error");
    if (erro != null) return null;   // confirmacao falhou — nao integrar

    BigDecimal nuNota = (BigDecimal) data.get("nunota");
    CompletableFuture.runAsync(() -> integracaoService.enviar(nuNota));
    return null;
}
```

- **Ordem não é garantida.** Vários callbacks podem estar registrados no mesmo evento (outros add-ons, configuração do ambiente). Nunca faça um depender do outro nem do que outro gravou.
- **Velocidade.** Roda dentro da transação da confirmação: milissegundos. Chamada externa (HTTP, e-mail, fila) sempre assíncrona.

---

## 9. Guice e registro

- A anotação **basta**: o build gera o registro e o deploy publica o callback no evento. Nada de `parameter.xml`, XML manual ou parâmetro editado à mão.
- A classe do callback **não precisa de binding** no módulo Guice — o SDK a descobre pela anotação. Registre os **services injetados** nela. Ver `dependency-injection`.
- `implements ICustomCallBack` é validado no build: sem isso, falha com `Classe <X> deve implementar 'br.com.sankhya.modelcore.custommodule.ICustomCallBack'`.
- Callback registrado que não dispara, com o par `when`/`event` correto: o ambiente pode não ter a personalização autorizada — verificar com o administrador antes de caçar bug no código.

---

## 10. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                            | Correção                                                                     |
|:--------------------------------------------------------|:-----------------------------------------------------------------------------|
| Registrar só um dos eventos de confirmação              | Central e Portal são eventos distintos — uma subclasse para cada (seção 7)  |
| Duas anotações `@Callback` na mesma classe              | Não é repetível: uma classe = um par `when`/`event`                          |
| `@Callback(when = AFTER, event = PROCESS_BILLING)`      | Só existe `BEFORE` — o build quebra                                          |
| Ler `data.get("bRegras")` num evento de confirmação     | A chave é `bregras` minúscula nesses eventos                                 |
| `AFTER` assumindo que a operação deu certo              | Checar `data.get("error")` antes de qualquer efeito                          |
| Exceção para dar um aviso ao usuário                    | `bRegras.addMensagem(...)`; exceção é para abortar                           |
| Chamada síncrona a API/Web Service                      | `CompletableFuture`, `ExecutorService` ou JMS                                |
| Lógica de negócio dentro do `call`                      | Delegar para Service (`@Component`)                                          |
| `new` em dependência gerenciada                         | Injetar via construtor com `@Inject`                                         |
| Usar `INSERTION` para reagir a CRUD de tabela           | Usar `@Listener`                                                             |

---

## 11. Checklist: novo `@Callback`

1. [ ] Confirmar que o gancho é ponto de ciclo do documento — se for barramento de nota de saída, `@BusinessRule`; se for CRUD, `@Listener`.
2. [ ] Escolher o `event` pela **tela**: Central → `PROCESS_CONFIRMATION`; Portal → `CONFIRMATION`; precisa das duas → duas subclasses.
3. [ ] Escolher o `when`: abortar/preparar → `BEFORE`; reagir ao resultado → `AFTER`.
4. [ ] Criar a classe `implements ICustomCallBack` (nomear `<Feature><Origem>Callback`).
5. [ ] Anotar com os três atributos: `when`, `event`, `description`.
6. [ ] Injetar dependências via construtor com `@Inject` (na subclasse concreta, se houver base).
7. [ ] Ler `data` com as chaves e tipos exatos do evento (seção 6) — atenção a `bregras` vs `bRegras`.
8. [ ] `AFTER`: checar `data.get("error")` na primeira linha.
9. [ ] Delegar a lógica para Service (`@Component`); integração externa assíncrona.
10. [ ] `return null` no fim — o retorno é descartado.
11. [ ] Registrar no módulo Guice os **services injetados**; a classe do callback não precisa de binding. Ver `dependency-injection`.

## Skills relacionadas

- `business-rule` — barramento comercial de nota de saída, o outro gancho de confirmação
- `listener` — eventos CRUD de persistência
- `action-button` — confirmação disparada por clique do usuário na grade
- `repository` — acesso a dados dentro do callback
- `dependency-injection` — wiring Guice dos services injetados no callback
- `test` — JUnit + Mockito do `ICustomCallBack`
