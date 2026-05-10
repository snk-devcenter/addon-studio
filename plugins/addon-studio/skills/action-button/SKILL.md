---
name: action-button
description: Cria, revisa e refatora botões de ação Sankhya com `@ActionButton` (`AcaoRotinaJava` + `@Form` + `ContextoAcao`) — incluindo validação, fluxo de tela e mensagens. Use ao criar, alterar, revisar, auditar ou padronizar classes `AcaoRotinaJava`, ao implementar `processarAcao`, ao trabalhar com arquivos `*Action.java`, ou ao tocar em código com a anotação `@ActionButton`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Botao de Acao (`@ActionButton`) — Addon Studio 2.0

`@ActionButton` associa uma classe Java ao menu "Acoes" de telas nativas do Sankhya Om. Disponivel a partir do Addon Studio 2.0.

> **Referencias complementares:**
> - `addon-studio` — Stack + restricoes Java 8
> - `dependency-injection` — Injecao de dependencia (Guice)

---

## 1. Quando usar

Use `@ActionButton` quando o usuario precisar disparar **manualmente** uma rotina de back-end a partir de registros de uma tela nativa.

**Casos de uso:**

| Caso | Exemplo |
|:-----|:--------|
| Integracao manual | "Enviar para E-commerce" |
| Geracao de arquivo/relatorio | "Exportar para Excel", "Gerar PDF" |
| Acao em massa | "Aprovar Lotes Selecionados" |
| Coleta de dados adicionais | Formulario antes de executar logica |

> **Nao use** para logica que dispara automaticamente ao salvar/excluir/modificar registros — use `@BusinessRule` ou Listener.

---

## 2. Anatomia de um `@ActionButton`

```java
import br.com.sankhya.extensions.actionbutton.AcaoRotinaJava;
import br.com.sankhya.extensions.actionbutton.ContextoAcao;
import br.com.sankhya.studio.annotations.hooks.ActionButton;

@ActionButton(
    description = "Enviar para E-commerce",          // Obrigatorio: texto no menu
    instanceName = "CabecalhoNota",                  // Obrigatorio: nome da entidade
    resourceId = "br.com.sankhya.core.mov.central"   // Recomendado: restringir a tela
)
public class EnviarEcommerceAction implements AcaoRotinaJava {

    private final EcommerceService ecommerceService;

    @Inject
    public EnviarEcommerceAction(EcommerceService ecommerceService) {
        this.ecommerceService = ecommerceService;
    }

    @Override
    public void doAction(ContextoAcao contexto) throws Exception {
        // Logica orquestrada — negocio fica no Service
        ecommerceService.enviar(contexto.getLinhas());
        contexto.setMensagemRetorno("Registros enviados com sucesso.");
    }
}
```

---

## 3. Atributos da anotacao `@ActionButton`

| Atributo           | Obrigatorio | Padrao      | Descricao                                                                                   |
|:-------------------|:------------|:------------|:--------------------------------------------------------------------------------------------|
| `description`      | Sim         | —           | Texto exibido no menu "Acoes" para o usuario.                                               |
| `instanceName`     | Sim         | —           | Nome da entidade (instancia) associada ao botao (ex.: `"CabecalhoNota"`).                   |
| `form`             | Nao         | sem form    | Formulario exibido antes de executar a acao. Ver secao 4.                                   |
| `transactionType`  | Nao         | `AUTOMATIC` | Comportamento transacional. `AUTOMATIC` = framework gerencia. `REQUIRES_NEW` = tx isolada.  |
| `accessControlled` | Nao         | `true`      | `true` = visibilidade respeita permissoes de acesso do usuario a tela.                      |
| `resourceId`       | Nao         | todas telas | Restringe o botao a uma tela especifica pelo seu ID de recurso.                             |
| `refreshType`      | Nao         | `ITEM`      | O que atualizar apos execucao. `ITEM` = registro atual. `RefreshTypeEnum.ALL` = tela toda.  |

```java
// Exemplo com todos os atributos
@ActionButton(
    description = "Aprovar Nota",
    instanceName = "CabecalhoNota",
    resourceId = "br.com.sankhya.core.mov.centraldenotas",
    transactionType = TransactionType.REQUIRES_NEW,
    accessControlled = true,
    refreshType = RefreshTypeEnum.ALL
)
```

---

## 4. Formulario (`@Form`)

Exibido ao usuario antes de `doAction()` ser chamado. Framework coleta os dados e os disponibiliza via `contexto.getParam()`.

### Tipos de campo (`FieldType`)

| `FieldType`  | Tipo retorno em `getParam()` | Uso tipico                  |
|:-------------|:-----------------------------|:----------------------------|
| `LIST`       | `String` (value da `@Option`)| Selecao de opcoes fixas     |
| `DATE`       | `java.sql.Timestamp`         | Data/hora                   |
| `CHECKBOX`   | `"S"` ou `"N"` como `String` | Flag booleano               |

### Anatomia do `@Form`

```java
form = @Form(
    fields = {
        @Field(
            name = "NOME_PARAM",        // Chave usada em contexto.getParam("NOME_PARAM")
            label = "Rotulo ao usuario",
            type = FieldType.LIST,
            required = true,            // Opcional, padrao false
            options = {                 // Somente para FieldType.LIST
                @Option(value = "A", label = "Opcao A"),
                @Option(value = "B", label = "Opcao B")
            }
        ),
        @Field(
            name = "DATA_REF",
            label = "Data de Referencia",
            type = FieldType.DATE,
            required = true
        ),
        @Field(
            name = "FLAG",
            label = "Incluir detalhes?",
            type = FieldType.CHECKBOX
        )
    }
)
```

### Leitura dos parametros em `doAction()`

```java
// LIST -> String
String formato = (String) contexto.getParam("FORMATO");

// DATE -> java.sql.Timestamp
java.sql.Timestamp dataRef = (java.sql.Timestamp) contexto.getParam("DATA_REF");

// CHECKBOX -> "S" ou "N"
boolean incluir = "S".equals(contexto.getParam("FLAG"));
```

---

## 5. `ContextoAcao` — API completa

| Metodo                              | Descricao                                                              |
|:------------------------------------|:-----------------------------------------------------------------------|
| `contexto.getLinhas()`              | Registros selecionados na tela. Iterar para operacoes em massa.        |
| `contexto.getParam("NOME")`         | Parametro preenchido no formulario. Cast necessario conforme tipo.     |
| `contexto.setMensagemRetorno("msg")`| Mensagem de sucesso ou erro exibida ao usuario apos execucao.          |

---

## 6. Exemplo completo com formulario

```java
package br.com.fabricante.addon.exemplos;

import br.com.sankhya.extensions.actionbutton.AcaoRotinaJava;
import br.com.sankhya.extensions.actionbutton.ContextoAcao;
import br.com.sankhya.studio.annotations.hooks.*;
import com.google.inject.Inject;

@ActionButton(
    description = "Exportar Dados para Planilha",
    instanceName = "CabecalhoNota",
    resourceId = "br.com.sankhya.core.mov.centraldenotas",
    form = @Form(
        fields = {
            @Field(
                name = "TIPO_ARQUIVO",
                label = "Formato",
                type = FieldType.LIST,
                required = true,
                options = {
                    @Option(value = "XLSX", label = "Excel (XLSX)"),
                    @Option(value = "CSV",  label = "CSV")
                }
            ),
            @Field(
                name = "DATA_INICIAL",
                label = "Data Inicial",
                type = FieldType.DATE,
                required = true
            ),
            @Field(
                name = "INCLUIR_ITENS",
                label = "Incluir Itens da Nota?",
                type = FieldType.CHECKBOX
            )
        }
    )
)
public class ExportarDadosAction implements AcaoRotinaJava {

    private final ExportacaoService exportacaoService;

    @Inject
    public ExportarDadosAction(ExportacaoService exportacaoService) {
        this.exportacaoService = exportacaoService;
    }

    @Override
    public void doAction(ContextoAcao contexto) throws Exception {
        String tipoArquivo = (String) contexto.getParam("TIPO_ARQUIVO");
        java.sql.Timestamp dataInicial = (java.sql.Timestamp) contexto.getParam("DATA_INICIAL");
        boolean incluirItens = "S".equals(contexto.getParam("INCLUIR_ITENS"));

        exportacaoService.exportar(tipoArquivo, dataInicial, incluirItens, contexto.getLinhas());

        contexto.setMensagemRetorno("Exportacao iniciada para o formato: " + tipoArquivo);
    }
}
```

---

## 7. Boas Praticas

- **Logica em Services**: `doAction()` orquestra — nao implementa regra de negocio. Delegue para `@Component`.
- **`resourceId` sempre que possivel**: Evita poluir menu "Acoes" de outras telas que usam a mesma entidade.
- **Feedback obrigatorio**: Sempre chame `contexto.setMensagemRetorno()`. Usuario sem retorno pensa que nada ocorreu.
- **`accessControlled = true`**: Mantenha o padrao. Altere para `false` somente com justificativa explicita.
- **Descricoes objetivas**: "Enviar para E-commerce" e correto. "Processar" ou "Executar" sao ambiguos.

---

## 8. Anti-Patterns (PROIBIDO)

| Anti-Pattern | Correcao |
|:-------------|:---------|
| Logica de negocio no `doAction()` | Mover para Service (`@Component`) |
| Nao chamar `setMensagemRetorno()` | Sempre fornecer feedback ao usuario |
| Usar para logica automatica (salvar/excluir) | Usar `@BusinessRule` ou Listener |
| `description` generica ("Processar", "Executar") | Descricao clara e contextualizada |
| `new` em dependencias gerenciadas | Injetar via construtor com `@Inject` |
| Usar para telas customizadas | Em telas customizadas, crie botoes proprios na UI |

---

## 9. Checklist: Novo `@ActionButton`

1. [ ] Criar classe implementando `AcaoRotinaJava` (nomear `<Feature>Action`).
2. [ ] Anotar com `@ActionButton(description = "...", instanceName = "...")`.
3. [ ] Definir `resourceId` para restringir a tela especifica.
4. [ ] Se precisar de dados do usuario: definir `@Form` com `@Field`s adequados.
5. [ ] Injetar dependencias via construtor com `@Inject` (Guice).
6. [ ] Implementar `doAction()` delegando logica para Service.
7. [ ] Chamar `contexto.setMensagemRetorno()` em todos os caminhos (sucesso e erro).
8. [ ] Definir `transactionType` se precisar de transacao isolada (`REQUIRES_NEW`).
9. [ ] Definir `refreshType` se precisar atualizar mais que o registro atual.
10. [ ] Registrar o `@Component` no modulo Guice do projeto (ver `dependency-injection`).


## Related Skills

- `controller` — alternativa REST quando ação não é botão de tela mas endpoint HTTP
- `dependency-injection` — @Component do AcaoRotinaJava precisa estar no módulo Guice
- `business-rule` — regra de negócio dispara via barramento — alternativa a botão para validações

## Skills relacionadas

- `entity` — modelo de dados que o botão lê/escreve
- `controller` — alternativa REST quando ação for headless
- `business-rule` — regra de negócio acionada por trás do botão
- `test` — JUnit 5 + Mockito da `AcaoRotinaJava`
