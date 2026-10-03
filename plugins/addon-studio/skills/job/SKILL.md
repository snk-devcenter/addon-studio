---
name: job
description: Cria, revisa e refatora jobs agendados Sankhya com `@Job` (`extends IJob` + `onSchedule` + `getScheduleConfig` + CRON), incluindo migration via XML. Use ao criar, alterar, revisar, auditar ou padronizar jobs agendados, ao ajustar agendamento CRON, quando o pedido é "roda todo dia às", "de madrugada", "processo noturno", "sem intervenção do usuário", "processamento em lote" ou "rotina agendada", ao trabalhar com arquivos `*Job.java`, ou ao tocar em código com `@Job`/`IJob`. NÃO usar para rotina disparada por clique do usuário na tela (`AcaoRotinaJava`) — isso é `action-button`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Jobs Agendados (`@Job`) — Addon Studio 2.0

`@Job` declara o agendamento direto na classe Java. Jobs sao gerenciados pelo SDK e suportam injecao de dependencias.

---

## 1. Anatomia de um `@Job`

```java
import br.com.sankhya.studio.annotations.Job;
import br.com.sankhya.studio.stereotypes.IJob;
import com.google.inject.Inject;

@Job(
    serviceName = "ProcessadorDeFilaSP", // Obrigatorio — convencao: terminar com "SP"
    frequency = "0 0/5 * * * ?"          // Opcional (default "&60000") — CRON e SEM "&"
)
public class ProcessadorDeFilaJob extends IJob {  // IJob e CLASSE ABSTRATA — use extends

    private final FilaService filaService;

    @Inject
    public ProcessadorDeFilaJob(FilaService filaService) {
        this.filaService = filaService;
    }

    @Override
    public void onSchedule() {
        filaService.processarItens();   // Logica e transacao ficam no Service (secao 4)
    }
}
```

> **Imports criticos** (assinaturas reais do SDK):
> - `@Job` → `br.com.sankhya.studio.annotations.Job` (nao `stereotypes.Job`)
> - `@Transactional` → `br.com.sankhya.studio.persistence.Transactional` (nao `transaction.Transactional`)
> - `IJob` → `br.com.sankhya.studio.stereotypes.IJob` (**classe abstrata** → `extends`)
> - `EJBTransactionType` → `br.com.sankhya.studio.annotations.enums.EJBTransactionType`

---

## 2. Atributos da anotacao `@Job`

| Atributo          | Obrigatorio | Descricao                                                                                          | Exemplo                          |
|:------------------|:------------|:---------------------------------------------------------------------------------------------------|:---------------------------------|
| `serviceName`     | **Sim**     | Nome unico do job (sem default). Convencao: terminar com "SP".                                      | `"SincronizadorSP"`              |
| `frequency`       | Nao         | Frequencia padrao. Default `"&60000"` (60s). ms usa prefixo `&`; **CRON e SEM `&`**.               | `"0 0 2 * * ?"` / `"&60000"`     |
| `transactionType` | Nao         | Comportamento transacional (`EJBTransactionType`). Default: `Supports`.                             | `EJBTransactionType.NotSupported` |

### Formato do `frequency`

| Formato          | Exemplo               | Descricao                         |
|:-----------------|:----------------------|:----------------------------------|
| CRON (sem `&`)   | `"0 0 2 * * ?"`       | Executa todo dia as 02:00         |
| CRON (sem `&`)   | `"0 0/15 * * * ?"`    | Executa a cada 15 minutos         |
| Milissegundos    | `"&120000"`           | Executa a cada 2 minutos (120s)   |
| Milissegundos    | `"&86400000"`         | Executa a cada 1 dia              |

> **O prefixo `&` e EXCLUSIVO do intervalo em milissegundos.** Expressao CRON e uma string pura de 6 campos: `segundos minutos horas dia-mes mes dia-semana` — **nunca** com `&`.

---

## 3. Classe abstrata `IJob` — Metodos

`IJob` e **classe abstrata** — sempre `extends IJob`, nunca `implements`.

| Metodo                    | Retorno  | Obrigatorio | Descricao                                                                                       |
|:--------------------------|:---------|:------------|:------------------------------------------------------------------------------------------------|
| `onSchedule()`            | `void`   | Sim         | Logica executada a cada disparo do agendador. `abstract` — precisa ser sobrescrito.             |
| `getScheduleConfig()`     | `String` | Nao         | Retorna a **frequencia dinamica**. Se retornar valor nao-nulo, **prevalece** sobre `frequency`. |
| `getScheduleConfigHook()` | `void`   | Nao         | **Obsoleto** (retrocompatibilidade). Retorno `void` — **nao** retorna frequencia.                |

### `getScheduleConfig()` — frequencia dinamica

> Quem retorna a frequencia dinamica e `getScheduleConfig()` (`String`), **nao** `getScheduleConfigHook()` (`void`, obsoleto). Se `getScheduleConfig()` retornar valor nao-nulo, ele sobrescreve o atributo `frequency`.

```java
// import br.com.sankhya.modelcore.util.MGECoreParameter;

@Override
public String getScheduleConfig() {
    // Le frequencia de parametro do sistema — sobrepoe o atributo frequency
    try {
        String frequencia = MGECoreParameter.getParameterAsString("MEUADDON_FREQ_JOB");
        return frequencia != null ? frequencia : "&3600000"; // fallback: 1 hora (ms)
    } catch (Exception e) {
        return "&3600000"; // getParameterAsString declara throws Exception; o override nao
    }
}
```

---

## 4. Controle transacional

| Cenario                     | Abordagem                                                          |
|:----------------------------|:-------------------------------------------------------------------|
| Job modifica dados          | `@Transactional` no metodo do service que grava; `onSchedule()` sem `@Transactional`, so captura e loga |
| Lote processado item a item | Service persiste cada item em metodo `@Transactional(Transactional.TxType.REQUIRES_NEW)` — item que falha nao desfaz os outros |
| Job somente leitura         | Consulta do service tambem sob `@Transactional` — so para abrir a sessao JAPE (ver abaixo) |
| Controle granular por trecho| `transactionType = EJBTransactionType.Supports` (padrao) + `@Transactional` no metodo |

> **Por que nao `@Transactional` no `onSchedule()`:** o job precisa de `try/catch` (secao 7). Com a transacao no `onSchedule()`, o `catch` que so loga faz o metodo terminar normalmente e a transacao **commita o que foi gravado ate o erro**. Com a transacao no service, a excecao sai do metodo transacional (rollback) e so depois e capturada pelo job. No Sankhya **qualquer** excecao que sai do metodo transacional faz rollback — `RuntimeException` ou checked (`throws Exception`), diferente do default EJB/Spring, que nao desfaz em checked.

### Sessao JAPE: `@Transactional` tambem em leitura

O EJB que o SDK gera a partir do `@Job` nao abre `JapeSession`. Sem um `@Transactional` no caminho entre o `onSchedule()` e o repository, qualquer consulta (`findOne`, `findByPK`, `@Criteria`...) falha com **"Nao existe uma sessao jape ativa."** — leitura nao precisa de transacao, precisa de sessao, e a transacao forca a abertura da sessao. `transactionType` no `@Job` **nao resolve**: e o controle do container EJB, nao abre nem fecha sessao. Nao abra `JapeSession`/transacao manualmente.

> Mesma falha do EJB gerado do `@Controller` (skill `controller`, secao 3), reportada a equipe de plataforma. Quando o SDK corrigir, leitura volta a dispensar `@Transactional` e esta secao sai.

### Valores de `Transactional.TxType`

`@Transactional` so pode ser aplicado em **metodo** (`@Target(METHOD)`) e tem precedencia sobre o `transactionType` da classe.

| `TxType` | Semantica |
|:---------|:----------|
| `REQUIRED` | **Default** do `@Transactional` bare. Usa a transacao existente; cria uma se nao houver. |
| `REQUIRES_NEW` | Sempre cria transacao nova, suspendendo a atual se existir; commita ao sair e retoma a anterior. Rollback posterior da transacao externa **nao** desfaz o que o metodo `REQUIRES_NEW` ja commitou. |
| `MANDATORY` | Exige transacao ativa; lanca excecao se nao houver. |
| `NOT_SUPPORTED` | Executa fora de transacao; suspende a atual se existir. |
| `NEVER` | Lanca excecao se houver transacao ativa. |

> **Nao existe `TxType.SUPPORTS`** — esses cinco valores sao o enum inteiro. `EJBTransactionType` (classe) e `Transactional.TxType` (metodo) sao enums **distintos e nao equivalentes**: `Required` → `REQUIRED` e `NotSupported` → `NOT_SUPPORTED`, mas `Supports` **nao tem equivalente por metodo** (para segui-lo, omita `@Transactional`), e `REQUIRES_NEW`/`MANDATORY`/`NEVER` nao tem equivalente de classe.

```java
// Job de escrita — a transacao e do service
@Log
@Job(serviceName = "SincronizadorSP", frequency = "0 0 2 * * ?")
public class SincronizadorJob extends IJob {

    @Override
    public void onSchedule() {
        try {
            sincronizadorService.executar();
        } catch (Exception e) {
            log.log(Level.SEVERE, "Falha na sincronizacao: {0}", e.getMessage());
        }
    }
}

@Component
public class SincronizadorService {

    @Transactional
    public void executar() {
        // tudo ou nada: excecao aqui desfaz todas as gravacoes do metodo
        // (consultas aqui dentro tambem ganham a sessao JAPE)
    }
}

// Lote item a item — cada item na sua transacao
@Log
@Component
public class ProcessadorFilaService {

    private final ItemFilaRepository itemFilaRepository;

    @Inject
    public ProcessadorFilaService(ItemFilaRepository itemFilaRepository) {
        this.itemFilaRepository = itemFilaRepository;
    }

    @Transactional // abre a sessao JAPE para o findPendentes; cada item commita na propria transacao
    public void processarPendentes() throws Exception {
        for (ItemFila item : itemFilaRepository.findPendentes()) {
            try {
                processarItem(item);
            } catch (Exception e) {
                // rollback ja aconteceu so neste item; segue para o proximo
                log.log(Level.SEVERE, "Falha no item " + item.getId(), e);
            }
        }
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void processarItem(ItemFila item) throws Exception {
        // gravacao do item; falha aqui desfaz so este item
    }
}

// Job de leitura — a consulta ainda precisa de sessao JAPE
@Job(serviceName = "RelatorioSP", frequency = "0 0 6 * * ?")
public class RelatorioJob extends IJob {

    @Override
    public void onSchedule() {
        relatorioService.gerar();
    }
}

@Component
public class RelatorioService {

    @Transactional // so abre a sessao JAPE; nada e gravado
    public void gerar() {
        // consultas via repository
    }
}
```

---

## 5. Exemplos completos

### Job simples (execucao periodica)

```java
import br.com.sankhya.studio.annotations.Job;
import br.com.sankhya.studio.stereotypes.IJob;
import com.google.inject.Inject;
import java.util.logging.Level;
import lombok.extern.java.Log;

@Log
@Job(serviceName = "SincronizadorDeEstoqueSP", frequency = "0 0 2 * * ?")
public class SincronizadorDeEstoqueJob extends IJob {

    private final EstoqueService estoqueService;

    @Inject
    public SincronizadorDeEstoqueJob(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @Override
    public void onSchedule() {
        try {
            estoqueService.sincronizar(); // @Transactional no metodo do service
            log.info("Sincronizacao de estoque finalizada.");
        } catch (Exception e) {
            log.log(Level.SEVERE, "Falha na sincronizacao de estoque: {0}", e.getMessage());
        }
    }
}
```

### Job com frequencia dinamica via parametro

```java
import br.com.sankhya.modelcore.util.MGECoreParameter;

@Log
@Job(serviceName = "ProcessadorFilaSP", frequency = "&300000") // default ms: 5 min
public class ProcessadorFilaJob extends IJob {

    private final FilaService filaService;

    @Inject
    public ProcessadorFilaJob(FilaService filaService) {
        this.filaService = filaService;
    }

    @Override
    public String getScheduleConfig() {  // String — retorna freq; NAO getScheduleConfigHook (void, obsoleto)
        try {
            String freq = MGECoreParameter.getParameterAsString("MEUADDON_FILA_FREQ");
            return freq != null ? freq : "&300000";
        } catch (Exception e) {
            return "&300000";
        }
    }

    @Override
    public void onSchedule() {
        try {
            filaService.processarItens();
        } catch (Exception e) {
            log.log(Level.SEVERE, "Erro ao processar fila: {0}", e.getMessage());
        }
    }
}
```

---

## 6. Migracao do modelo legado (XML)

> **Atencao:** ao usar `@Job`, os arquivos `mgeschedule.xml` e `mgechedule-cfg.xml` **nao sao permitidos**. Se existirem, **a compilacao falhara**.

| Legado (`mgeschedule.xml`)         | Novo (`@Job`)                                       |
|:-----------------------------------|:----------------------------------------------------|
| Classe `SessionBean` com EJB tags  | Classe POJO `extends IJob`                           |
| Configuracao em XML separado       | Configuracao na propria anotacao                    |
| `getScheduleConfig()` retorna freq | `getScheduleConfig()` (override) para freq dinamica |
| `@ejb.transaction type="Supports"` | `transactionType = EJBTransactionType.Supports`     |

```java
// LEGADO — nao usar
public class MeuJobBean extends SessionBean {
    public String getScheduleConfig() throws Exception {
        return "&" + ONE_DAY;
    }
    public void onSchedule() throws Exception { ... }
}

// NOVO — usar
@Job(serviceName = "MeuJobSP", frequency = "&86400000")
public class MeuJob extends IJob {
    @Override
    public void onSchedule() { ... }
}
```

---

## 7. Boas Praticas

- **Classe enxuta (boa pratica)**: `onSchedule()` orquestra e delega para outra classe injetada (ex.: service `@Component`) — a organizacao em camadas e do projeto.
- **Tratamento de erros**: sempre `try/catch` no `onSchedule()` — falha sem captura pode impedir execucoes futuras.
- **Logging**: `@Log` Lombok + `java.util.logging`. Nunca `System.out`.
- **Transacao adequada**: escrita → `@Transactional` no metodo do service; lote item a item → metodo por item com `REQUIRES_NEW`; somente leitura → consulta tambem sob `@Transactional` (sessao JAPE).
- **Frequencia configuravel**: Use `getScheduleConfig()` (`String`) + parametro do sistema para evitar hardcode.
- **Integracoes externas**: o job e o worker natural da tabela-fila alimentada por listener/regra; mantenha a chamada HTTP fora do trecho `@Transactional`.

---

## 8. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                            | Correcao                                                  |
|:--------------------------------------------------------|:----------------------------------------------------------|
| `mgeschedule.xml` junto com `@Job`                      | Remover XMLs — compilacao falha se coexistirem            |
| `implements IJob` (IJob e classe abstrata)              | `extends IJob`                                            |
| `import ...stereotypes.Job`                             | `import br.com.sankhya.studio.annotations.Job`            |
| `import ...transaction.Transactional`                   | `import br.com.sankhya.studio.persistence.Transactional`  |
| `@Job(name = ...)`                                      | `@Job(serviceName = ...)`                                 |
| CRON com prefixo `&` (ex.: `"&0 0 2 * * ?"`)            | CRON e SEM `&`; `&` so para intervalo em ms               |
| `getScheduleConfigHook()` retornando `String` p/ freq   | `getScheduleConfig()` retorna a freq (`Hook` e `void`/obsoleto) |
| `TransactionType.X`                                     | `EJBTransactionType.X`                                    |
| `System.out.println` para logging                       | `@Log` Lombok + `java.util.logging`                       |
| `new` em dependencias gerenciadas                       | Injetar via construtor com `@Inject`                      |
| `@Transactional` no `onSchedule()` com `try/catch` que so loga | Commita a escrita parcial — `@Transactional` no metodo do service |
| Consulta via repository sem `@Transactional` no caminho | Falha com "Nao existe uma sessao jape ativa." — `@Transactional` no metodo do service (secao 4) |
| `@Transactional(Transactional.TxType.SUPPORTS)`         | Nao existe — omitir `@Transactional` (metodo herda `Supports` da classe) |

---

## 9. Checklist: Novo `@Job`

1. [ ] Criar classe `extends IJob` (nomear `<Feature>Job`). `IJob` e classe abstrata.
2. [ ] Anotar com `@Job(serviceName = "<Feature>SP", frequency = "<expressao>")`.
3. [ ] `serviceName` unico (convencao: terminar com "SP"). `frequency`: ms usa `&`; **CRON sem `&`**.
4. [ ] Imports corretos: `annotations.Job`, `persistence.Transactional`, `stereotypes.IJob`, `annotations.enums.EJBTransactionType`.
5. [ ] Injetar dependencias via construtor com `@Inject` (Guice).
6. [ ] Implementar `onSchedule()` (retorno `void`) delegando logica para Service.
7. [ ] Se o job grava: `@Transactional` no metodo do service, nao no `onSchedule()`; lote item a item: gravacao por item em metodo `REQUIRES_NEW`.
8. [ ] Somente leitura: a consulta do service tambem fica sob `@Transactional` (sessao JAPE, secao 4) — `transactionType` nao abre sessao.
9. [ ] Envolver corpo de `onSchedule()` em `try/catch` com logging adequado.
10. [ ] Se frequencia for dinamica: sobrescrever `getScheduleConfig()` retornando `String` (nao `getScheduleConfigHook()`).
11. [ ] Confirmar que **nao existem** `mgeschedule.xml` nem `mgechedule-cfg.xml` no projeto.
12. [ ] Registrar no modulo Guice os **services/dependencias injetados** na classe — o job em si nao precisa de binding (o SDK o descobre pela anotacao `@Job`). Ver `dependency-injection`.

## Skills relacionadas

- `dependency-injection` — wiring Guice dos services injetados no job
- `repository` — jobs tipicamente operam sobre dados via repository
- `value` — configuração agendamento via `@Value`/`SANKHYA_PARAM`
