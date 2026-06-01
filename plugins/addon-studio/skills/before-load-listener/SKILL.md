---
name: before-load-listener
description: Cria, revisa e padroniza interceptadores de busca Sankhya com `@BeforeLoadListener` (interface `FinderListener` + método `beforeExecute`) — injeta filtros/critérios dinâmicos no Finder JAPE antes da query chegar ao banco. Use ao criar, alterar, revisar, auditar ou padronizar interceptação de buscas/carregamento de entidades, ao implementar `beforeExecute`, ao aplicar filtro de segurança/multi-tenant transversal a uma entidade, ao trabalhar com classes `*FinderListener`, ou ao tocar em código com `@BeforeLoadListener`/`FinderListener`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Interceptador de Buscas (`@BeforeLoadListener`) — Addon Studio 2.0

`@BeforeLoadListener` executa lógica personalizada **sempre que uma entidade é carregada ou pesquisada via JAPE**. Intercepta a execução do *Finder* — permite adicionar filtros, ordenações ou validar parâmetros de busca **antes** da query chegar ao banco. A anotação automatiza o atributo `finder-listener` no XML da entidade — **sem edição manual de XML**.

> **Beta / Acesso Antecipado:** funcionalidade do SDK Sankhya sujeita a mudanças. Acesso via e-mail a `developer@sankhya.com.br` informando a `appkey`.
>
> **Referências complementares:**
> - `entity` / `data-dictionary` — entidade-alvo precisa estar declarada
> - `repository` — sintaxe `this.CAMPO` da clause (mesma do `@Criteria`)
> - `dependency-injection` — `@Inject` de service/repository no listener

---

## 1. Quando usar — `@BeforeLoadListener` vs `@Criteria` vs `@Listener` vs `@BusinessRule`

| Mecanismo             | Escopo                                                  | Quando usar                                                                                       |
|:----------------------|:--------------------------------------------------------|:--------------------------------------------------------------------------------------------------|
| `@BeforeLoadListener` | **Toda** busca/carregamento de UMA entidade (transversal)| Filtro **transversal** aplicado a toda leitura da entidade, independente de quem consulta (segurança, multi-tenant, soft-delete). |
| `@Criteria` (repository)| Uma query específica                                  | Filtro pontual em **um** método de busca declarado no repository.                                 |
| `@Listener`           | CRUD (insert/update/delete) de qualquer entidade        | Validar/modificar campos ao **gravar/excluir**.                                                   |
| `@BusinessRule`       | Confirmação/faturamento de notas (saída, mov. interna)  | Regras transacionais comerciais com barramento de regras.                                         |

**Regra rápida:** filtro que precisa valer em **todas** as buscas da entidade (sem depender de quem chamou)? `@BeforeLoadListener`. Filtro de uma consulta só? `@Criteria` no repository.

---

## 2. Pré-requisito fundamental

A entidade **precisa estar declarada no Dicionário de Dados** — de uma das duas formas:

1. Arquivo XML de entidade (ex.: `Produto.xml` em `datadictionary/`) — skill `data-dictionary`.
2. Anotação `@JapeEntity` na classe de modelo — skill `entity`.

> Sem declaração por nenhum desses meios, o SDK **não tem onde injetar** a configuração do listener.

### Restrição de instâncias — só as do próprio add-on

`@BeforeLoadListener` só pode interceptar **instâncias criadas pelo próprio add-on**. **NÃO** é permitido em instâncias nativas do sistema (ex.: `Parceiro`, `Produto` nativo, `CabecalhoNota`, etc.).

---

## 3. Anatomia

```java
import br.com.sankhya.jape.core.FinderListener;
import br.com.sankhya.jape.metadata.EntityMetaData;
import br.com.sankhya.jape.wrapper.FinderWrapper;
import br.com.sankhya.studio.annotations.BeforeLoadListener;
import lombok.extern.java.Log;

@Log
@BeforeLoadListener(instance = "MinhaInstancia")
public class MinhaInstanciaFinderListener implements FinderListener {

    @Override
    public void beforeExecute(EntityMetaData entity, FinderWrapper finder) throws Exception {
        // Adiciona um critério de busca adicional
        finder.where("this.ATIVO = 'S'");

        log.info("Filtro de seguranca aplicado para a entidade: " + entity.getName());
    }
}
```

---

## 4. Atributo da anotação `@BeforeLoadListener`

| Atributo   | Obrigatório | Descrição                                                                                  |
|:-----------|:------------|:-------------------------------------------------------------------------------------------|
| `instance` | Sim         | Nome da **instância (entidade)** a interceptar — o mesmo valor de `@JapeEntity(entity = "...")` ou de `<entity name="...">` no XML. **Não** é o nome da tabela. |

> **Gotcha:** `instance` é o **nome lógico da entidade**, não a tabela. Para `@JapeEntity(entity = "CabecalhoNota", table = "TGFCAB")`, usa-se `@BeforeLoadListener(instance = "CabecalhoNota")`.

---

## 5. Interface `FinderListener`

```java
package br.com.sankhya.jape.core;

public interface FinderListener {
    void beforeExecute(EntityMetaData entity, FinderWrapper finder) throws Exception;
}
```

| Parâmetro                | Tipo                                          | Uso                                                            |
|:-------------------------|:----------------------------------------------|:--------------------------------------------------------------|
| `entity`                 | `br.com.sankhya.jape.metadata.EntityMetaData` | Metadados da entidade interceptada (`entity.getName()`, etc.).|
| `finder`                 | `br.com.sankhya.jape.wrapper.FinderWrapper`   | Builder da consulta — adicionar critérios via `finder.where(...)`. |

- Método declara `throws Exception` — exceção lançada **bloqueia** a busca e propaga ao chamador.
- `finder.where(String clause)` adiciona critério à query. **Prefixo `this.` obrigatório** em todo campo da clause (mesma convenção do `@Criteria` — ver `repository`).

---

## 6. Filtros dinâmicos por contexto do usuário

Use o `finder` para critérios baseados no usuário logado:

```java
@Log
@BeforeLoadListener(instance = "TdcXyzPedido")
public class TdcXyzPedidoFinderListener implements FinderListener {

    @Override
    public void beforeExecute(EntityMetaData entity, FinderWrapper finder) throws Exception {
        BigDecimal codUsu = JapeSession.getContext().getUserID();
        finder.where("this.CODUSUCAD = " + codUsu);
        log.info("Buscas de " + entity.getName() + " filtradas pelo usuario " + codUsu);
    }
}
```

> Para SQL portável (Oracle/MSSQL) na clause — datas, `nullValue`, `ignorecase`, etc. — use **macros Sankhya** em vez de sintaxe específica de banco (`SYSDATE`, `NVL`, `||`). Ver skill `macros`.

---

## 7. Injeção de dependência

Diferente dos listeners JAPE tradicionais, `@BeforeLoadListener` **suporta `@Inject`** (Guice). Delegue lógica de leitura de contexto/config a um service ou repository injetado via construtor:

```java
import com.google.inject.Inject;
import lombok.extern.java.Log;

@Log
@BeforeLoadListener(instance = "TdcXyzContrato")
public class TdcXyzContratoFinderListener implements FinderListener {

    private final EscopoUsuarioService escopoService;

    @Inject
    public TdcXyzContratoFinderListener(EscopoUsuarioService escopoService) {
        this.escopoService = escopoService;
    }

    @Override
    public void beforeExecute(EntityMetaData entity, FinderWrapper finder) throws Exception {
        String filialClause = escopoService.clauseFiliaisPermitidas(); // ex.: "this.CODFIL IN (1, 3)"
        finder.where(filialClause);
    }
}
```

- `@Inject` de **`com.google.inject.Inject`** — nunca `javax.inject.Inject`.
- Dependências `private final`, injetadas via construtor. Nunca `new` em dependência gerenciada.
- `EscopoUsuarioService` registrado no módulo Guice do projeto (ver `dependency-injection`).

---

## 8. Benefícios

- ✅ **Injeção de dependências:** `@Inject` para acessar services e repositories.
- ✅ **Configuração zero:** sem editar XML de entidade para registrar o listener — a anotação automatiza o atributo `finder-listener`.
- ✅ **Segurança tipada:** o SDK valida em compile-time que a classe implementa `FinderListener` e que `instance` foi informado.

---

## 9. Performance — método roda em TODA busca

`beforeExecute` é chamado em **todas** as buscas da entidade. **Mantenha o método leve.**

- **Evite** consultas pesadas ao banco dentro de `beforeExecute`.
- Cacheie dados estáveis (config, perfis) em vez de reconsultar a cada busca.
- Lógica complexa → delegar a service injetado, com cache quando aplicável.

---

## 10. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                                       | Correção                                                          |
|:-------------------------------------------------------------------|:------------------------------------------------------------------|
| Usar em instância nativa (`Parceiro`, `Produto`, `CabecalhoNota`)  | Só instâncias do próprio add-on                                   |
| Múltiplos `@BeforeLoadListener` para a mesma instância             | Apenas **um** por entidade — múltiplos = erro de compilação       |
| Esquecer de declarar a entidade no dicionário (XML / `@JapeEntity`)| Sem declaração o listener não é injetado                          |
| Consulta pesada ao banco dentro de `beforeExecute`                 | Método roda em toda busca — manter leve / cachear                 |
| Omitir prefixo `this.` na clause do `finder.where(...)`            | Usar `this.CAMPO = ...` — obrigatório                             |
| SQL específico de banco na clause (`SYSDATE`, `NVL`, `ROWNUM`)     | Usar macros Sankhya portáveis (`dbDate()`, `nullValue()`, etc.)   |
| `new` em dependência gerenciada                                    | `@Inject` via construtor (Guice)                                  |
| `@Inject` de `javax.inject`                                        | Usar `com.google.inject.Inject`                                   |
| `System.out` / SLF4J para log                                      | `@Log` Lombok + `java.util.logging`                               |

---

## 11. Checklist: Novo `@BeforeLoadListener`

1. [ ] Entidade-alvo declarada no dicionário (XML ou `@JapeEntity`) e é **instância do próprio add-on**.
2. [ ] Classe implementa `br.com.sankhya.jape.core.FinderListener`.
3. [ ] Anotada com `@BeforeLoadListener(instance = "<NomeDaInstancia>")` — nome = `@JapeEntity(entity = "...")`, **não** a tabela.
4. [ ] Apenas **um** `@BeforeLoadListener` para a instância em todo o projeto.
5. [ ] `beforeExecute` adiciona critérios via `finder.where("this.CAMPO ...")` com prefixo `this.`.
6. [ ] Macros portáveis no lugar de SQL específico de banco.
7. [ ] Método **leve** — sem consultas pesadas (roda em toda busca).
8. [ ] Dependências (service/repository) via `@Inject` construtor (Guice), se necessárias.
9. [ ] `@Log` Lombok para logging (`java.util.logging`).
10. [ ] Filtros dinâmicos por usuário via `JapeSession.getContext().getUserID()`.

## Related Skills

- `entity` — entidade-alvo precisa estar declarada via `@JapeEntity`
- `data-dictionary` — declaração XML; atributo `finder-listener` automatizado pela anotação
- `repository` — sintaxe `this.CAMPO` da clause (igual ao `@Criteria`)
- `macros` — SQL portável Oracle/MSSQL na clause do `finder.where(...)`
- `dependency-injection` — wiring Guice do service/repository injetado no listener

## Skills relacionadas

- `entity` — entidade interceptada
- `repository` — alternativa por-query (`@Criteria`) ao filtro transversal
- `business-rule` — hook transacional comercial (escopo distinto)
- `dependency-injection` — `@Inject` no listener
- `test` — JUnit + Mockito do `beforeExecute`
