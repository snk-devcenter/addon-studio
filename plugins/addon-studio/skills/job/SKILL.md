---
name: job
description: Cria, revisa e refatora jobs agendados Sankhya com `@Job` (`extends IJob` + `onSchedule` + `getScheduleConfig` + CRON), incluindo migration via XML. Use ao criar, alterar, revisar, auditar ou padronizar jobs agendados, ao ajustar agendamento CRON, ao trabalhar com arquivos `*Job.java`, ou ao tocar em código com `@Job`/`IJob`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Jobs Agendados (`@Job`) — Addon Studio 2.0

`@Job` substitui a configuracao via `mgeschedule.xml` por abordagem declarativa diretamente na classe Java. Jobs sao gerenciados pelo SDK e suportam injecao de dependencias.

---

## 1. Anatomia de um `@Job`

```java
import br.com.sankhya.studio.annotations.Job;
import br.com.sankhya.studio.persistence.Transactional;
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
    @Transactional
    public void onSchedule() {
        filaService.processarItens();   // Logica delegada ao Service
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
| Job modifica dados          | `@Transactional` no `onSchedule()` — garante atomicidade          |
| Job somente leitura         | `transactionType = EJBTransactionType.NotSupported` — melhor desempenho |
| Controle granular por trecho| `transactionType = EJBTransactionType.Supports` (padrao) + `@Transactional` no metodo |

### Valores de `Transactional.TxType`

`@Transactional` so pode ser aplicado em **metodo** (`@Target(METHOD)`) e tem precedencia sobre o `transactionType` da classe.

| `TxType` | Semantica |
|:---------|:----------|
| `REQUIRED` | **Default** do `@Transactional` bare. Usa a transacao existente; cria uma se nao houver. |
| `REQUIRES_NEW` | Sempre cria transacao nova, suspendendo a atual se existir. |
| `MANDATORY` | Exige transacao ativa; lanca excecao se nao houver. |
| `NOT_SUPPORTED` | Executa fora de transacao; suspende a atual se existir. |
| `NEVER` | Lanca excecao se houver transacao ativa. |

> **Nao existe `TxType.SUPPORTS`** — esses cinco valores sao o enum inteiro. `EJBTransactionType` (classe) e `Transactional.TxType` (metodo) sao enums **distintos e nao equivalentes**: `Required` → `REQUIRED` e `NotSupported` → `NOT_SUPPORTED`, mas `Supports` **nao tem equivalente por metodo** (para segui-lo, omita `@Transactional`), e `REQUIRES_NEW`/`MANDATORY`/`NEVER` nao tem equivalente de classe.

```java
// Job de escrita — transacao atomica
@Job(serviceName = "SincronizadorSP", frequency = "0 0 2 * * ?")
public class SincronizadorJob extends IJob {

    @Override
    @Transactional
    public void onSchedule() {
        sincronizarService.executar();
    }
}

// Job de leitura — sem overhead transacional
@Job(
    serviceName = "RelatorioSP",
    frequency = "0 0 6 * * ?",
    transactionType = EJBTransactionType.NotSupported
)
public class RelatorioJob extends IJob {

    @Override
    public void onSchedule() {
        relatorioService.gerar();
    }
}
```

---

## 5. Exemplos completos

### Job simples (execucao periodica)

```java
import br.com.sankhya.studio.annotations.Job;
import br.com.sankhya.studio.persistence.Transactional;
import br.com.sankhya.studio.stereotypes.IJob;
import com.google.inject.Inject;
import java.util.logging.Level;
import java.util.logging.Logger;

@Job(serviceName = "SincronizadorDeEstoqueSP", frequency = "0 0 2 * * ?")
public class SincronizadorDeEstoqueJob extends IJob {

    private static final Logger log = Logger.getLogger(SincronizadorDeEstoqueJob.class.getName());

    private final EstoqueService estoqueService;

    @Inject
    public SincronizadorDeEstoqueJob(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @Override
    @Transactional
    public void onSchedule() {
        try {
            estoqueService.sincronizar();
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

@Job(serviceName = "ProcessadorFilaSP", frequency = "&300000") // default ms: 5 min
public class ProcessadorFilaJob extends IJob {

    private static final Logger log = Logger.getLogger(ProcessadorFilaJob.class.getName());

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
    @Transactional
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

- **Logica em Services**: `onSchedule()` orquestra — delega para `@Component`.
- **Tratamento de erros**: sempre `try/catch` no `onSchedule()` — falha sem captura pode impedir execucoes futuras.
- **Logging**: `Logger` (`java.util.logging`) + nivel adequado. Nunca `System.out`.
- **Transacao adequada**: `@Transactional` em jobs de escrita; `NotSupported` em jobs somente leitura.
- **Frequencia configuravel**: Use `getScheduleConfig()` (`String`) + parametro do sistema para evitar hardcode.
- **Assincrono para integracoes externas**: chamadas a APIs dentro do job = `CompletableFuture` ou similar.

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
| Logica de negocio no `onSchedule()`                     | Mover para Service (`@Component`)                         |
| Chamada sincrona a API externa no job                   | Usar `CompletableFuture` ou fila assincrona              |
| `System.out.println` para logging                       | Usar `Logger` (`java.util.logging`)                       |
| `new` em dependencias gerenciadas                       | Injetar via construtor com `@Inject`                      |
| Job de escrita sem `@Transactional`                     | Adicionar `@Transactional` no `onSchedule()`             |
| `@Transactional(Transactional.TxType.SUPPORTS)`         | Nao existe — omitir `@Transactional` (metodo herda `Supports` da classe) |

---

## 9. Checklist: Novo `@Job`

1. [ ] Criar classe `extends IJob` (nomear `<Feature>Job`). `IJob` e classe abstrata.
2. [ ] Anotar com `@Job(serviceName = "<Feature>SP", frequency = "<expressao>")`.
3. [ ] `serviceName` unico (convencao: terminar com "SP"). `frequency`: ms usa `&`; **CRON sem `&`**.
4. [ ] Imports corretos: `annotations.Job`, `persistence.Transactional`, `stereotypes.IJob`, `annotations.enums.EJBTransactionType`.
5. [ ] Injetar dependencias via construtor com `@Inject` (Guice).
6. [ ] Implementar `onSchedule()` (retorno `void`) delegando logica para Service.
7. [ ] Adicionar `@Transactional` se job modificar dados.
8. [ ] Definir `transactionType = EJBTransactionType.NotSupported` se job for somente leitura.
9. [ ] Envolver corpo de `onSchedule()` em `try/catch` com logging adequado.
10. [ ] Se frequencia for dinamica: sobrescrever `getScheduleConfig()` retornando `String` (nao `getScheduleConfigHook()`).
11. [ ] Confirmar que **nao existem** `mgeschedule.xml` nem `mgechedule-cfg.xml` no projeto.
12. [ ] Registrar no modulo Guice os **services/dependencias injetados** na classe — o job em si nao precisa de binding (o SDK o descobre pela anotacao `@Job`). Ver `dependency-injection`.

## Skills relacionadas

- `dependency-injection` — wiring Guice dos services injetados no job
- `repository` — jobs tipicamente operam sobre dados via repository
- `value` — configuração agendamento via `@Value`/`SANKHYA_PARAM`
- `database` — migration XML do registro do job
- `addon-studio` — regras universais Java 8 + Lombok
