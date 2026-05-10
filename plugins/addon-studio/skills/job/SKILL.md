---
name: job
description: Cria, revisa e refatora jobs agendados Sankhya com `@Job` (`IJob` + `onSchedule` + `getScheduleConfigHook` + CRON), incluindo migration via XML. Use ao criar, alterar, revisar, auditar ou padronizar jobs agendados, ao ajustar agendamento CRON, ao trabalhar com arquivos `*Job.java`, ou ao tocar em código com `@Job`/`IJob`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Jobs Agendados (`@Job`) — Addon Studio 2.0

`@Job` substitui a configuracao via `mgeschedule.xml` por abordagem declarativa diretamente na classe Java. Jobs sao gerenciados pelo SDK e suportam injecao de dependencias.

> **Beta / Acesso Antecipado**: funcionalidade sujeita a mudancas. Contato: developer@sankhya.com.br.
>
> **Referencias complementares:**
> - `addon-studio` — Stack + restricoes Java 8
> - `dependency-injection` — Injecao de dependencia (Guice)

---

## 1. Anatomia de um `@Job`

```java
import br.com.sankhya.studio.stereotypes.IJob;
import br.com.sankhya.studio.stereotypes.Job;
import br.com.sankhya.studio.transaction.Transactional;
import com.google.inject.Inject;

@Job(
    name = "ProcessadorDeFilaSP",       // Obrigatorio — deve terminar com "SP"
    frequency = "&0 0/5 * * * ?"        // Obrigatorio — deve comecar com "&"
)
public class ProcessadorDeFilaJob implements IJob {

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

---

## 2. Atributos da anotacao `@Job`

| Atributo          | Obrigatorio | Descricao                                                                                          | Exemplo                          |
|:------------------|:------------|:---------------------------------------------------------------------------------------------------|:---------------------------------|
| `name`            | Sim         | Nome do Bean gerado. **Deve terminar com "SP"**.                                                   | `"SincronizadorSP"`              |
| `frequency`       | Sim         | Frequencia de execucao. **Deve comecar com "&"**. Aceita CRON ou intervalo em ms.                 | `"&0 0/15 * * * ?"` / `"&60000"` |
| `transactionType` | Nao         | Comportamento transacional padrao. Padrao: `Supports` (controle manual via `@Transactional`).      | `TransactionType.NotSupported`   |

### Formato do `frequency`

| Formato          | Exemplo               | Descricao                         |
|:-----------------|:----------------------|:----------------------------------|
| CRON             | `"&0 0 2 * * ?"`      | Executa todo dia as 02:00         |
| CRON             | `"&0 0/15 * * * ?"`   | Executa a cada 15 minutos         |
| Milissegundos    | `"&120000"`           | Executa a cada 2 minutos (120s)   |
| Milissegundos    | `"&86400000"`         | Executa a cada 1 dia              |

> Expressao CRON Sankhya usa 6 campos: `segundos minutos horas dia-mes mes dia-semana`.

---

## 3. Interface `IJob` — Metodos

| Metodo                   | Obrigatorio | Descricao                                                                                          |
|:-------------------------|:------------|:---------------------------------------------------------------------------------------------------|
| `onSchedule()`           | Sim         | Logica executada a cada disparo do agendador.                                                      |
| `getScheduleConfigHook()`| Nao         | Executado **uma unica vez** na inicializacao. Retorna frequencia dinamica (ex: lida de parametro). |

### `getScheduleConfigHook()` — configuracao dinamica

```java
@Override
public String getScheduleConfigHook() {
    // Le frequencia de parametro do sistema — sobrepoe o atributo frequency
    String frequencia = SystemParam.getParam("MEUADDON_FREQ_JOB");
    return frequencia != null ? frequencia : "&3600000"; // fallback: 1 hora
}
```

---

## 4. Controle transacional

| Cenario                     | Abordagem                                                          |
|:----------------------------|:-------------------------------------------------------------------|
| Job modifica dados          | `@Transactional` no `onSchedule()` — garante atomicidade          |
| Job somente leitura         | `transactionType = TransactionType.NotSupported` — melhor desempenho |
| Controle granular por trecho| `transactionType = Supports` (padrao) + `@Transactional` no metodo |

```java
// Job de escrita — transacao atomica
@Job(name = "SincronizadorSP", frequency = "&0 0 2 * * ?")
public class SincronizadorJob implements IJob {

    @Override
    @Transactional
    public void onSchedule() {
        sincronizarService.executar();
    }
}

// Job de leitura — sem overhead transacional
@Job(
    name = "RelatorioSP",
    frequency = "&0 0 6 * * ?",
    transactionType = TransactionType.NotSupported
)
public class RelatorioJob implements IJob {

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
import br.com.sankhya.studio.stereotypes.IJob;
import br.com.sankhya.studio.stereotypes.Job;
import br.com.sankhya.studio.transaction.Transactional;
import com.google.inject.Inject;
import java.util.logging.Level;
import java.util.logging.Logger;

@Job(name = "SincronizadorDeEstoqueSP", frequency = "&0 0 2 * * ?")
public class SincronizadorDeEstoqueJob implements IJob {

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
@Job(name = "ProcessadorFilaSP", frequency = "&300000") // fallback: 5 min
public class ProcessadorFilaJob implements IJob {

    private static final Logger log = Logger.getLogger(ProcessadorFilaJob.class.getName());

    private final FilaService filaService;

    @Inject
    public ProcessadorFilaJob(FilaService filaService) {
        this.filaService = filaService;
    }

    @Override
    public String getScheduleConfigHook() {
        String freq = SystemParam.getParam("MEUADDON_FILA_FREQ");
        return freq != null ? freq : "&300000";
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

| Legado (`mgeschedule.xml`)         | Novo (`@Job`)                                 |
|:-----------------------------------|:----------------------------------------------|
| Classe `SessionBean` com EJB tags  | Classe POJO implementando `IJob`              |
| Configuracao em XML separado       | Configuracao na propria anotacao              |
| `getScheduleConfig()` retorna freq | `getScheduleConfigHook()` para config dinamica|
| `@ejb.transaction type="Supports"` | `transactionType = TransactionType.Supports`  |

```java
// LEGADO — nao usar
public class MeuJobBean extends SessionBean {
    public String getScheduleConfig() throws Exception {
        return "&" + ONE_DAY;
    }
    public void onSchedule() throws Exception { ... }
}

// NOVO — usar
@Job(name = "MeuJobSP", frequency = "&86400000")
public class MeuJob implements IJob {
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
- **Frequencia configuravel**: Use `getScheduleConfigHook()` + parametro do sistema para evitar hardcode.
- **Assincrono para integracoes externas**: chamadas a APIs dentro do job = `CompletableFuture` ou similar.

---

## 8. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                        | Correcao                                               |
|:----------------------------------------------------|:-------------------------------------------------------|
| `mgeschedule.xml` junto com `@Job`                  | Remover XMLs — compilacao falha se coexistirem         |
| `name` sem sufixo "SP"                              | Sempre `<Nome>SP`                                      |
| `frequency` sem prefixo "&"                         | Sempre `"&<expressao>"`                                |
| Logica de negocio no `onSchedule()`                 | Mover para Service (`@Component`)                      |
| Chamada sincrona a API externa no job               | Usar `CompletableFuture` ou fila assincrona            |
| `System.out.println` para logging                   | Usar `Logger` (`java.util.logging`)                    |
| `new` em dependencias gerenciadas                   | Injetar via construtor com `@Inject`                   |
| Job de escrita sem `@Transactional`                 | Adicionar `@Transactional` no `onSchedule()`           |

---

## 9. Checklist: Novo `@Job`

1. [ ] Criar classe implementando `IJob` (nomear `<Feature>Job`).
2. [ ] Anotar com `@Job(name = "<Feature>SP", frequency = "&<expressao>")`.
3. [ ] Verificar que `name` termina com "SP" e `frequency` comeca com "&".
4. [ ] Injetar dependencias via construtor com `@Inject` (Guice).
5. [ ] Implementar `onSchedule()` delegando logica para Service.
6. [ ] Adicionar `@Transactional` se job modificar dados.
7. [ ] Definir `transactionType = NotSupported` se job for somente leitura.
8. [ ] Envolver corpo de `onSchedule()` em `try/catch` com logging adequado.
9. [ ] Se frequencia for dinamica: implementar `getScheduleConfigHook()`.
10. [ ] Confirmar que **nao existem** `mgeschedule.xml` nem `mgechedule-cfg.xml` no projeto.
11. [ ] Registrar no modulo Guice do projeto (ver `dependency-injection`).


## Related Skills

- `dependency-injection` — @Component do IJob precisa estar registrado no módulo Guice
- `repository` — jobs tipicamente operam sobre dados via repository
- `addon-studio` — regras universais Java 8 + Lombok

## Skills relacionadas

- `dependency-injection` — wiring Guice do job
- `repository` — acesso a dados dentro do `onSchedule`
- `value` — configuração agendamento via `@Value`/`SANKHYA_PARAM`
- `database` — migration XML do registro do job
