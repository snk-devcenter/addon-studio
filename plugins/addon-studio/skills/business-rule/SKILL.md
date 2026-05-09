---
name: business-rule
description: Implement Sankhya @BusinessRule (Regra interface + ContextoRegra) for event bus, limit liberation, and transactional rules. Use when creating business rules or editing files matching `*Regra.java`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Regra de Negocio (`@BusinessRule`) — Addon Studio 2.0

`@BusinessRule` implementa logica automatica disparada por eventos do ciclo de vida comercial — principalmente **confirmacao e faturamento** de documentos (Pedidos, Notas de Venda). Disponivel a partir do Addon Studio 2.0.

> **Referencias complementares:**
> - `addon-studio` — Stack + restricoes Java 8
> - `dependency-injection` — Injecao de dependencia (Guice)

---

## 1. Quando usar — `@BusinessRule` vs `@Callback` vs `@Listener`

| Hook              | Escopo                                                        | Quando usar                                                                                      |
|:------------------|:--------------------------------------------------------------|:-------------------------------------------------------------------------------------------------|
| `@BusinessRule`   | Notas de Saida e Mov. Interna (Vendas, Remessas, etc.)        | Logica que interage com barramento de regras (`ContextoRegra`): liberacoes de limite, validacoes complexas na confirmacao/faturamento. |
| `@Callback`       | Todos documentos comerciais, incluindo Notas de Entrada       | Eventos de negocio onde `@BusinessRule` nao atua (ex: notas de compra) ou quando barramento nao e necessario. |
| `@Listener`       | Operacoes CRUD (insert/update/delete) em qualquer entidade    | Validacoes e modificacoes de campo disparadas ao salvar/excluir. Preferir para CRUD simples.     |

**Regra rapida:**
- Liberacao de limite em nota de venda? `@BusinessRule`.
- Validar nota de compra na confirmacao? `@Callback`.
- Logica ao salvar/excluir qualquer registro? `@Listener`.

---

## 2. Anatomia de um `@BusinessRule`

```java
import br.com.sankhya.modelcore.comercial.Regra;
import br.com.sankhya.modelcore.comercial.ContextoRegra;
import br.com.sankhya.studio.annotations.hooks.BusinessRule;
import com.google.inject.Inject;

@BusinessRule(description = "Valida desconto na confirmacao")
public class ValidacaoDescontoRegra implements Regra {

    private final DescontoService descontoService;

    @Inject
    public ValidacaoDescontoRegra(DescontoService descontoService) {
        this.descontoService = descontoService;
    }

    @Override
    public void beforeUpdate(ContextoRegra ctx) throws Exception {
        DynamicVO notaVO = (DynamicVO) ctx.getPrePersistEntityState().getNewVO();
        // logica de negocio delegada ao Service
        descontoService.validar(notaVO, ctx.getBarramentoRegra());
    }

    // Demais metodos da interface podem ficar vazios se nao forem necessarios
}
```

---

## 3. Atributo da anotacao `@BusinessRule`

| Atributo      | Obrigatorio | Descricao                                                       |
|:--------------|:------------|:----------------------------------------------------------------|
| `description` | Sim         | Descricao legivel da regra — aparece nos logs e configuracoes.  |

---

## 4. Interface `Regra` — Metodos disponíveis

Implemente apenas os metodos que forem necessarios. Os demais podem ficar com corpo vazio.

| Metodo             | Quando dispara                                      | Foco da `@BusinessRule`                   |
|:-------------------|:----------------------------------------------------|:------------------------------------------|
| `beforeInsert(ctx)`| Antes de inserir o documento                        | Raramente usado — prefira `@Listener`     |
| `afterInsert(ctx)` | Apos inserir o documento                            | Raramente usado — prefira `@Listener`     |
| `beforeUpdate(ctx)`| Antes de atualizar (inclui confirmacao/faturamento) | **Caso de uso principal**                 |
| `afterUpdate(ctx)` | Apos atualizar (inclui confirmacao/faturamento)     | Integracoes assincronas pos-confirmacao   |
| `beforeDelete(ctx)`| Antes de excluir o documento                        | Raramente usado — prefira `@Listener`     |
| `afterDelete(ctx)` | Apos excluir o documento                            | Raramente usado — prefira `@Listener`     |

---

## 5. `ContextoRegra` — API

### Acessar dados da nota

```java
// Estado atual (com modificacoes do evento)
DynamicVO notaVO = (DynamicVO) ctx.getPrePersistEntityState().getNewVO();

// Estado anterior (disponivel em beforeUpdate e beforeDelete)
DynamicVO oldNotaVO = (DynamicVO) ctx.getPrePersistEntityState().getOldVO();

// Leitura de campos do DynamicVO
BigDecimal nuNota      = notaVO.asBigDecimal("NUNOTA");
String     confirmada  = notaVO.asString("CONFIRMADA");
BigDecimal percDesc    = notaVO.asBigDecimal("PERCDESC");

// Escrita de campo (modificacao em memoria, persiste com a transacao)
notaVO.setProperty("OBSERVACAO", "Conferido automaticamente.");
```

### Interagir com barramento de regras

```java
// Aviso nao bloqueante para o usuario
ctx.getBarramentoRegra().addMensagem("Desconto acima do limite — aviso gerado.");

// Solicitacao de liberacao de limite (evento deve estar cadastrado no sistema)
LiberacaoSolicitada lib = new LiberacaoSolicitada(
    notaVO.asBigDecimal("NUNOTA"),  // numero da nota
    "TGFCAB",                       // tabela
    2000,                           // ID do evento de liberacao
    BigDecimal.ONE                  // ID do usuario solicitante
);
lib.setPendente(true);
ctx.getBarramentoRegra().addLiberacaoSolicitada(lib);
```

### Bloquear a operacao

```java
// Lance excecao — mensagem exibida ao usuario e transacao revertida
throw new Exception("Limite de credito excedido. Operacao bloqueada.");
```

---

## 6. Detectar o momento da confirmacao

O evento `beforeUpdate` dispara em varios momentos. Para agir somente na confirmacao:

```java
@Override
public void beforeUpdate(ContextoRegra ctx) throws Exception {
    DynamicVO notaVO    = (DynamicVO) ctx.getPrePersistEntityState().getNewVO();
    DynamicVO oldNotaVO = (DynamicVO) ctx.getPrePersistEntityState().getOldVO();

    // Abordagem 1: comparar campo CONFIRMADA entre old e new
    boolean isConfirmando = "S".equals(notaVO.asString("CONFIRMADA"))
        && (oldNotaVO == null || !"S".equals(oldNotaVO.asString("CONFIRMADA")));

    if (!isConfirmando) return;

    // ... logica especifica da confirmacao
}
```

---

## 7. Exemplos completos

### Exemplo 1: Solicitacao de liberacao de limite

```java
import br.com.sankhya.modelcore.comercial.Regra;
import br.com.sankhya.modelcore.comercial.ContextoRegra;
import br.com.sankhya.modelcore.util.LiberacaoSolicitada;
import br.com.sankhya.studio.annotations.hooks.BusinessRule;
import com.google.inject.Inject;
import java.math.BigDecimal;

@BusinessRule(description = "Solicita liberacao para vendas com desconto alto")
public class LiberacaoDescontoRegra implements Regra {

    @Override
    public void beforeUpdate(ContextoRegra ctx) throws Exception {
        DynamicVO notaVO = (DynamicVO) ctx.getPrePersistEntityState().getNewVO();

        Boolean isConfirmando = (Boolean) JapeSession.getProperty("CabecalhoNota.confirmando.nota");
        if (!Boolean.TRUE.equals(isConfirmando)) return;

        BigDecimal percDesc = notaVO.asBigDecimal("PERCDESC");
        if (percDesc == null || percDesc.compareTo(new BigDecimal("10")) <= 0) return;

        LiberacaoSolicitada lib = new LiberacaoSolicitada(
            notaVO.asBigDecimal("NUNOTA"),
            "TGFCAB",
            2000,           // ID do evento de liberacao cadastrado no sistema
            BigDecimal.ONE
        );
        lib.setPendente(true);

        ctx.getBarramentoRegra().addLiberacaoSolicitada(lib);
        ctx.getBarramentoRegra().addMensagem("Solicitacao de liberacao enviada para desconto acima de 10%.");
    }
}
```

### Exemplo 2: Modificar campo somente na confirmacao

```java
@BusinessRule(description = "Adiciona observacao de conferencia na confirmacao")
public class AdicionaObservacaoConfirmacaoRegra implements Regra {

    @Override
    public void beforeUpdate(ContextoRegra ctx) throws Exception {
        DynamicVO notaVO    = (DynamicVO) ctx.getPrePersistEntityState().getNewVO();
        DynamicVO oldNotaVO = (DynamicVO) ctx.getPrePersistEntityState().getOldVO();

        boolean isConfirmando = "S".equals(notaVO.asString("CONFIRMADA"))
            && (oldNotaVO == null || !"S".equals(oldNotaVO.asString("CONFIRMADA")));

        if (!isConfirmando) return;

        String obsAtual = notaVO.asString("OBSERVACAO");
        String novaObs  = "Nota conferida e confirmada pelo sistema.";
        notaVO.setProperty("OBSERVACAO", obsAtual == null ? novaObs : obsAtual + "\n" + novaObs);
    }
}
```

### Exemplo 3: Integracao assincrona pos-confirmacao

```java
@BusinessRule(description = "Envia nota para sistema externo apos confirmacao")
public class IntegracaoExternaRegra implements Regra {

    private final IntegracaoService integracaoService;

    @Inject
    public IntegracaoExternaRegra(IntegracaoService integracaoService) {
        this.integracaoService = integracaoService;
    }

    @Override
    public void afterUpdate(ContextoRegra ctx) throws Exception {
        DynamicVO notaVO    = (DynamicVO) ctx.getPrePersistEntityState().getNewVO();
        DynamicVO oldNotaVO = (DynamicVO) ctx.getPrePersistEntityState().getOldVO();

        boolean isConfirmando = "S".equals(notaVO.asString("CONFIRMADA"))
            && (oldNotaVO == null || !"S".equals(oldNotaVO.asString("CONFIRMADA")));

        if (!isConfirmando) return;

        BigDecimal nuNota = notaVO.asBigDecimal("NUNOTA");

        // Assincrono — nao bloqueia thread da confirmacao
        CompletableFuture.runAsync(() -> integracaoService.enviar(nuNota));
    }
}
```

---

## 8. Boas Praticas

- **Velocidade**: Regra roda dentro da transacao da confirmacao. Deve executar em milissegundos.
- **Assincronismo para integracoes**: Chamadas a APIs externas = sempre `CompletableFuture`, `ExecutorService` ou JMS. Nunca sincrono.
- **Logica em Services**: Mantenha a classe da `@BusinessRule` enxuta — delegue para `@Component`.
- **Feedback ao usuario**: Use `addMensagem()` para informar acoes automaticas executadas.
- **Excecoes para bloqueio**: Lance `Exception` com mensagem clara para impedir a operacao.

---

## 9. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                   | Correcao                                                    |
|:-----------------------------------------------|:------------------------------------------------------------|
| Usar para CRUD simples (salvar/excluir)         | Usar `@Listener`                                            |
| Chamada sincrona a API/Web Service              | Usar `CompletableFuture` ou JMS                             |
| Logica de negocio no metodo da interface        | Mover para Service (`@Component`)                           |
| Usar `afterInsert` para validacao               | Validar em `beforeInsert` — apos salvar e tarde demais      |
| `new` em dependencias gerenciadas               | Injetar via construtor com `@Inject`                        |
| Usar para Notas de Entrada (compras)            | Usar `@Callback`                                            |

---

## 10. Checklist: Novo `@BusinessRule`

1. [ ] Confirmar que o caso de uso e especifico de nota de saida/mov. interna — senao usar `@Callback` ou `@Listener`.
2. [ ] Criar classe implementando `Regra` (nomear `<Feature>Regra`).
3. [ ] Anotar com `@BusinessRule(description = "...")`.
4. [ ] Injetar dependencias via construtor com `@Inject` (Guice).
5. [ ] Implementar apenas os metodos de evento necessarios.
6. [ ] Detectar o momento correto (confirmacao, faturamento) via comparacao `oldVO`/`newVO` ou `JapeSession`.
7. [ ] Delegar logica de negocio para Service (`@Component`).
8. [ ] Integracoes externas: usar mecanismo assincrono.
9. [ ] Fornecer feedback ao usuario via `addMensagem()` ou excecao com mensagem clara.
10. [ ] Registrar no modulo Guice do projeto (ver `dependency-injection`).


## Related Skills

- `action-button` — botão dispara fluxo que pode invocar regra
- `controller` — controller pode invocar regra via barramento
- `dependency-injection` — @Component da Regra precisa estar registrado no módulo Guice
