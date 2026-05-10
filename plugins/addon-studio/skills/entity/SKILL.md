---
name: entity
description: Cria, revisa e refatora entidades Java `@JapeEntity` Sankhya — Lombok (`@Data`/`@NoArgsConstructor`/`@AllArgsConstructor`), PK simples/composta com `@Embeddable`, `@Column`, `@Id`, `@JoinColumn`, `@OneToMany`/`@OneToOne`/`@ManyToOne`, `@Relationship`, naming `<PRX><MOD3><CTX>`, mapeamento de tipos (`Integer`/`BigDecimal`/`String`/`Boolean`/`Date`/`Timestamp`). Use ao criar, alterar, revisar, auditar ou padronizar entidades, ou ao tocar em código com `@JapeEntity`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Entidade Java (@JapeEntity) — Addon Studio 2.0

Entidade Java = representação domínio de tabela banco. **Limpa** — contém só mapeamento estrutural mínimo. Metadata UI, tipos, descrições, comportamento fica no **Dicionário de Dados** (XMLs em `datadictionary/`).

> **Referência complementar:** consulte `data-dictionary` para criar XML correspondente à entidade.

---

## 1. Regras Fundamentais

| Regra                                                | Detalhe                                                   |
|:-----------------------------------------------------|:----------------------------------------------------------|
| `@Column` só tem `name`                              | `@Column(name = "COLUNA")` — nenhum outro atributo.       |
| `@JoinColumn` só tem `name` e `referencedColumnName` | `@JoinColumn(name = "...", referencedColumnName = "...")` |
| `@JapeEntity` tem `entity`, `table`, `isNativeTable` e `isNativeInstance` | Addon puro: `@JapeEntity(entity = "...", table = "...")`. Tabela nativa Sankhya: adicionar `isNativeTable = true`. Instância também nativa: adicionar `isNativeInstance = true`. Veja seção 1.2. |
| Sem `@Expression`                                    | Expressões ficam no XML (`<expression>`).                 |
| Sem `@GeneratedValue`                                | Sequência fica no XML (`sequenceType`/`sequenceField`).   |
| Sem `@Option` / `@Property`                          | Opções ficam no XML (`<fieldOptions>`).                   |
| Lombok obrigatório                                   | `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`.     |
| Convencao de nomenclatura no `entity`/`table`        | Veja secao 1.1.                                           |

### 1.1 Convencao de nomes (parametrizada por projeto)

Padrao parametrizado por `<PRX>` (prefixo) + `<MOD3>` (modulo). Ver `database` secao "Descobrir convencao do projeto" antes de criar.

| Atributo  | Padrao                              | Exemplo (PRX=TDC, MOD3=XYZ)  |
|:----------|:------------------------------------|:-----------------------------|
| `entity`  | `<Prx><Mod><Ctx>` (PascalCase)      | `TdcXyzCabecalho`            |
| `table`   | `<PRX><MOD3><CTX>` (UPPER)          | `TDCXYZCAB`                  |

Componentes:

- `<Prx>` / `<PRX>`: prefixo fixo do projeto, **3-4 chars** (ex.: `Tdc`/`TDC`, `App`/`APP`, `Cst`/`CST`)
- `<Mod>` / `<MOD3>`: sigla do modulo, **3 caracteres** (ex.: `Xyz`/`XYZ`, `Fin`/`FIN`, `Fat`/`FAT`)
- `<Ctx>` / `<CTX>`: contexto/entidade (ex.: `Cabecalho`/`CAB`, `Item`/`ITE`, `Configuracao`/`CFG`)

`entity` usa PascalCase legivel (`Xyz`, nao `XYZ`). `table` usa UPPER concatenado.

Exemplo coerente (`<PRX>`=`TDC`, `<MOD3>`=`XYZ`):

```java
@JapeEntity(entity = "TdcXyzCabecalho", table = "TDCXYZCAB")
```

> Antes criar entidade nova: (1) inspecionar projeto pra detectar `<PRX>` existente; (2) se ausente, perguntar dev `<PRX>` + `<MOD3>` + `<CTX>`; (3) confirmar `entity` + `table` final.

> **NOTA:** exemplos seguintes usam `TDC` como prefixo ilustrativo. Substituir pelo `<PRX>` real do projeto.

### 1.2 Tabelas e Instâncias Nativas Sankhya (`isNativeTable` / `isNativeInstance`)

`@JapeEntity` aceita dois flags para sinalizar quando a tabela e/ou a instância já existem no Sankhya nativo. **Os dois flags são independentes** e cobrem 3 cenários:

| Cenário                               | `isNativeTable` | `isNativeInstance` | Tag XML correspondente                  |
|:--------------------------------------|:----------------|:-------------------|:----------------------------------------|
| Tabela addon + Instância addon        | omitir          | omitir             | `<table>` + `<instance>`                |
| Tabela nativa + Instância **nova** do addon | `true`    | omitir             | `<nativeTable>` + `<instance>`          |
| Tabela nativa + Instância nativa      | `true`          | `true`             | `<nativeTable>` + `<nativeInstance>`    |

> **Por que isso importa:** sem `isNativeTable`, o KSP rejeita a compilação com erro de entidade duplicada ao detectar que a tabela já existe. Sem `isNativeInstance` em uma instância nativa, a instância é regravada no `metadata.xml` gerado e, durante o deploy do addon, o dicionário a re-mapeia para o owner do addon — quebrando todas as regras, validações e telas nativas que dependem dessa instância.

Tabelas nativas mais comuns: `TGFCAB`, `TGFFIN`, `TGFORD`, `TGFVEI`, `TGFEMP`, `TGFPAR`, `TGFPRO`, `TGFITE`.
Instâncias nativas mais comuns associadas: `CabecalhoNota` (TGFCAB), `ItemNota` (TGFITE), `Parceiro` (TGFPAR), `Produto` (TGFPRO), `TipoOperacao` (TGFTOP), `Financeiro` (TGFFIN).

```java
// 1) Tabela e instância do addon — sem flags
@JapeEntity(entity = "TdcXyzCabecalho", table = "TDCXYZCAB")
public class TdcXyzCabecalho { ... }

// 2) Tabela nativa, instância NOVA do addon — só isNativeTable
@JapeEntity(entity = "TdcXyzDefensivos", table = "TGFDFAGR", isNativeTable = true)
public class TdcXyzDefensivos { ... }

// 3) Tabela e instância nativas — os dois flags
@JapeEntity(entity = "CabecalhoNota", table = "TGFCAB",
            isNativeTable = true, isNativeInstance = true)
public class CabecalhoNota { ... }
```

> **Regra prática:** se o `entity` for um nome usado pelo Sankhya nativo (`CabecalhoNota`, `ItemNota`, `Parceiro`, `Produto`, etc.), use `isNativeInstance = true`. Se o `entity` segue a convenção `Tdc<Modulo><Contexto>` do addon, é instância nova — não use `isNativeInstance`.

---

## 2. Organizacao

> Skill nao opina sobre estrutura de pacotes. Organize entidades, Enums, PKs compostas, classes de dominio puro conforme arquitetura do seu projeto.

Tipos de classe que aparecem aqui:

| Tipo                                       | Caracteristica                                                          |
|:-------------------------------------------|:------------------------------------------------------------------------|
| Entidade persistida (`@JapeEntity`)        | Mapeia tabela do banco                                                  |
| PK composta (`@Embeddable`)                | Classe que agrupa colunas-chave de uma PK composta                      |
| Enum (Value Object)                        | Valores finitos persistidos como texto curto                            |
| Classe sem persistencia                    | Conceito de negocio, sem `@JapeEntity` (`@Data` + factory methods)      |

---

## 3. Tipos de Classe no Domínio

### 3.1 Entidade Persistida (`@JapeEntity`)

Representa tabela no banco. Tem `@JapeEntity`, `@Id`, `@Column`, opcionalmente relacionamentos.

```java

@JapeEntity(entity = "TdcXyzAlvo", table = "TDCXYZALV")
public class TdcXyzAlvo { ...
}
```

### 3.2 PK Composta (`@Embeddable`)

Tabela com PK composta — classe separada anotada com `@Embeddable`.

```java

@Embeddable
public class TdcXyzEntidadeId { ...
}
```

### 3.3 Enum (Value Object)

Valores finitos de domínio (listas opções). Usados como tipo campo em entidades. Têm `value` = valor armazenado no banco.

**Regras obrigatórias:**

| Regra                              | Detalhe                                                          |
|:-----------------------------------|:-----------------------------------------------------------------|
| `@Getter` (Lombok)                 | Gera o getter de `value` automaticamente.                        |
| `@AllArgsConstructor` (Lombok)     | Gera o construtor que recebe `value`.                            |
| Campo `private final String value` | Valor persistido no banco (código curto).                        |
| Sufixo `Enum`                      | Nome da classe sempre termina com `Enum` (ex: `TipoStatusEnum`). |

**Anatomia completa:**

```java
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TipoEnum {
    OPCAO_A("A"),
    OPCAO_B("B");

    private final String value;
}
```

### 3.4 Classe de Domínio Puro

Classes representando conceitos domínio **sem persistência direta**. Sem `@JapeEntity`. Contêm lógica negócio, validações, factory methods.

```java
public class ResultadoCalculo { ...
}

public class DadosConsolidados { ...
}
```

---

## 4. Anatomia de uma Entidade

```java
import br.com.sankhya.studio.persistence.*;                    // 1. Imports de persistência
import lombok.*;                                                // 2. Imports Lombok

@Data                                                           // 3. Lombok obrigatório
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(                                                    // 4. Mapeamento: somente entity + table
    entity = "NomeDaEntidade",
    table = "NOME_TABELA"
)
public class NomeDaEntidade {                                   // 5. Classe plana (sem herança de metadata)

    @Id                                                         // 6. Chave primária
    @Column(name = "COLUNA_PK")
    private Integer id;

    @Column(name = "COLUNA_1")                                  // 7. Campos: somente name
    private String campo1;

    @OneToMany(...)                                             // 9. Relacionamentos (se houver)
    private List<EntidadeFilha> filhos;

    public void metodoDeNegocio() { ...}                      // 10. Métodos de domínio (se houver)
}
```

---

## 5. Anotações Permitidas

### Anotações que DEVEM ser usadas

| Anotação                     | Uso                                             | Pacote                              |
|:-----------------------------|:------------------------------------------------|:------------------------------------|
| `@JapeEntity(entity, table)` | Toda entidade persistida                        | `br.com.sankhya.studio.persistence` |
| `@Id`                        | Campo(s) de chave primária                      | `br.com.sankhya.studio.persistence` |
| `@Column(name)`              | Todo campo persistido                           | `br.com.sankhya.studio.persistence` |
| `@Embeddable`                | Classe de PK composta                           | `br.com.sankhya.studio.persistence` |
| `@Data`                      | Getter/Setter/ToString/Equals/Hash              | `lombok`                            |
| `@NoArgsConstructor`         | Construtor vazio (obrigatório para o framework) | `lombok`                            |
| `@AllArgsConstructor`        | Construtor com todos os campos                  | `lombok`                            |

### Anotações opcionais (usar quando necessário)

| Anotação                                  | Quando usar                                                                  | Pacote                              |
|:------------------------------------------|:-----------------------------------------------------------------------------|:------------------------------------|
| `@Builder`                                | Quando a entidade é construída programaticamente no domínio                  | `lombok`                            |
| `@OneToMany`                              | Relacionamento pai -> filhos                                                  | `br.com.sankhya.studio.persistence` |
| `@OneToOne`                               | Navegação para entidade referenciada                                         | `br.com.sankhya.studio.persistence` |
| `@ManyToOne`                              | Navegação inversa filho -> pai                                                | `br.com.sankhya.studio.persistence` |
| `@JoinColumn(name, referencedColumnName)` | Junto com `@OneToOne` / `@ManyToOne`                                         | `br.com.sankhya.studio.persistence` |
| `@JoinColumns`                            | Múltiplos `@JoinColumn` (FK composta)                                        | `br.com.sankhya.studio.persistence` |
| `@Cascade`                                | Dentro de `@OneToMany` para cascatear operações                              | `br.com.sankhya.studio.persistence` |
| `@Relationship`                           | Dentro de `@OneToMany` para definir campos do vínculo                        | `br.com.sankhya.studio.persistence` |
| `@SuperBuilder`                           | Quando a entidade herda de classe base de domínio (ex: VO com campos comuns) | `lombok.experimental`               |
| `@EqualsAndHashCode(callSuper = true)`    | Junto com herança + `@SuperBuilder`                                          | `lombok`                            |

### Anotações PROIBIDAS na entidade

| Anotação          | Onde fica                          | Motivo                |
|:------------------|:-----------------------------------|:----------------------|
| `@Expression`     | XML `<expression>`                 | Metadata do framework |
| `@GeneratedValue` | XML `sequenceType`/`sequenceField` | Metadata do framework |
| `@Option`         | XML `<fieldOptions>`               | Metadata de UI        |
| `@Property`       | XML                                | Metadata do framework |

---

## 6. Chave Primária (PK)

Padrões de chave primária — `@Id` em PK simples (Integer ou BigDecimal conforme tabela addon vs nativa) e PK composta via `@Embeddable` com convenções e métodos auxiliares — em [`references/primary-key.md`](references/primary-key.md).

---

## 7. Campos (@Column)

### Regra única

```java

@Column(name = "NOME_COLUNA")
private TipoJava nomeCampo;
```

Nenhum outro atributo. Ponto.

### Mapeamento de tipos

| Tipo no banco / XML              | Tipo Java sugerido                     |
|:---------------------------------|:---------------------------------------|
| `INTEIRO`                        | `Integer` ou `BigDecimal`              |
| `TEXTO`                          | `String`                               |
| `DECIMAL`                        | `BigDecimal`                           |
| `DATA_HORA`                      | `Timestamp` (`java.sql.Timestamp`)     |
| `CHECKBOX`                       | `Boolean`                              |
| `PESQUISA` (FK)                  | `BigDecimal` ou `Integer` (tipo da FK) |
| Campo com opções (enum no banco) | Enum Java (veja seção 9)               |

### Quando usar `Integer` vs `BigDecimal`

| Contexto                                       | Tipo                      | Motivo                           |
|:-----------------------------------------------|:--------------------------|:---------------------------------|
| PKs de tabelas do add-on (`COD*`/`NU*`)        | `Integer`                 | Sequenciais do add-on sao inteiros simples |
| PKs de tabelas nativas (NUNOTA, CODPARC, etc.) | `BigDecimal`              | Padrão do Sankhya Om             |
| Quantidades, valores monetários                | `BigDecimal`              | Precisão decimal                 |
| Campos numéricos simples                       | `BigDecimal` ou `Integer` | Conforme necessidade             |

---

## 8. Relacionamentos

Padrões de relacionamento — `@OneToMany` (pai → filhos), `@OneToOne` + `@JoinColumn` (navegação para entidade referenciada), `@OneToOne`/`@ManyToOne` + `@JoinColumns` (FK composta), `@ManyToOne` + `@JoinColumn` (filho → pai), e quando usar cada — em [`references/relationships.md`](references/relationships.md).

---

## 9. Enums (Value Objects)

Enums = valores finitos armazenados no banco como texto curto (geralmente 1 caractere).

### Estrutura padrão

```java
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum NomeEnum {
    OPCAO_UM("V"),
    OPCAO_DOIS("P");

    private final String value;
}
```

### Convenções

| Regra                | Detalhe                                                  |
|:---------------------|:---------------------------------------------------------|
| Anotações            | `@AllArgsConstructor`, `@Getter`                         |
| Campo `value`        | `private final String value` — valor armazenado no banco |
| Nomes das constantes | `UPPER_SNAKE_CASE` descritivo                            |
| Valores              | Strings curtas (1-2 caracteres, geralmente)              |

### Uso na entidade

```java

@Column(name = "TIPMOV")
private TipoMovimento tipoMovimento;
```

Framework converte automaticamente entre valor no banco (`"V"`) e enum Java (`TipoMovimento.VENDA`).

---

## 10. Classes de Domínio Puro

Classes = conceitos de negócio sem mapeamento direto para tabela. Contêm lógica domínio rica.

### Características

- **Sem** `@JapeEntity`, `@Id`, `@Column`.
- Usam só `@Data` do Lombok (ou construtor manual).
- Podem ter factory methods (`create(...)`) com validações.

### Exemplo simples

```java

@Data
public class ResultadoCalculo {

    private BigDecimal valor;
    private String mensagem;
}
```

### Exemplo com factory method e validação

```java

@Data
public class DocumentoGerado {

    private CabecalhoDocumento cabecalho;
    private List<ItemDocumento> itens;

    private DocumentoGerado(CabecalhoDocumento cabecalho, List<ItemDocumento> itens) {
        this.cabecalho = cabecalho;
        this.itens = itens;
    }

    public static DocumentoGerado create(CabecalhoDocumento cabecalho, List<ItemDocumento> itens) {
        if (itens == null || itens.isEmpty()) {
            throw new CreateIssueException("Deve conter ao menos um item.");
        }
        return new DocumentoGerado(cabecalho, itens);
    }
}
```

---

## 11. Métodos de Domínio

Entidades podem (e devem) conter **lógica negócio** relacionada ao estado interno.

### Regras

- Métodos operam sobre campos da própria entidade.
- Nomes expressam intenção de negócio (não técnica).
- Não acessam banco, serviços, repositórios — só próprios dados.

### Exemplos

```java
// Consulta de estado
public Boolean isVenda() {
    return this.tipoMovimento == TipoMovimento.PEDIDO_VENDA
        || this.tipoMovimento == TipoMovimento.VENDA;
}

public Boolean estaAtivo() {
    return this.ativo != null && this.ativo;
}

// Mutação de estado
public void cancelar(Timestamp dataCancelamento) {
    this.dhCancelamento = dataCancelamento;
    this.status = Status.CANCELADO;
}

// Delegação para entidade relacionada
public Boolean deveProcessar() {
    return this.getTipoOperacao() != null
        && this.getTipoOperacao().deveProcessar();
}
```

---

## 12. Passo a Passo: Criando uma Entidade do Zero

Tutorial completo (criar XML do dicionário → entidade Java → `@Embeddable` se PK composta → enum se aplicável → validar) usando exemplo `TdcXyzFornecedor` — em [`references/walkthrough.md`](references/walkthrough.md).

---

## 13. Exemplos Completos

Entidades completas — PK simples, PK composta + relacionamentos, `@OneToMany` (pai com filhos), entidade nativa com `@Builder` + métodos de domínio, entidade só com PK composta, enum, classe `@Embeddable` — em [`references/examples.md`](references/examples.md).

---

## 14. Checklist

### Criando uma entidade nova

1. [ ] Criar XML dicionário em `datadictionary/<TABELA>.xml` (ver `data-dictionary`).
2. [ ] Criar classe Java conforme arquitetura do projeto.
3. [ ] Anotar com `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`.
4. [ ] Anotar com `@JapeEntity(entity = "...", table = "...")`. Tabela nativa Sankhya (TGFCAB, TGFFIN, TGFORD, etc.): adicionar `isNativeTable = true`. Instância também nativa (entity = `CabecalhoNota`, `Parceiro`, `Produto`, etc.): adicionar também `isNativeInstance = true`. Ver seção 1.2.
5. [ ] Definir PK com `@Id` + `@Column(name)` (simples) ou `@Id` + classe `@Embeddable` (composta).
6. [ ] Cada campo persistido com `@Column(name = "...")` — só `name`.
7. [ ] Tipo Java correto para cada campo (ver tabela tipos).
8. [ ] Relacionamentos só quando necessários no domínio.
9. [ ] `@JoinColumn` com só `name` e `referencedColumnName`.
10. [ ] Nenhum `@Expression`, `@GeneratedValue`, `@Option`, `@Property`.
11. [ ] Imports limpos (só o usado).

### Criando um enum

1. [ ] Criar conforme arquitetura do projeto.
2. [ ] Anotar com `@AllArgsConstructor`, `@Getter`.
3. [ ] Campo `private final String value`.
4. [ ] Constantes em `UPPER_SNAKE_CASE`.

### Criando uma PK composta

1. [ ] Criar classe com nome `<Entidade>Id`.
2. [ ] Anotar com `@Data`, `@AllArgsConstructor`, `@NoArgsConstructor`, `@Embeddable`.
3. [ ] Cada campo com `@Column(name = "...")` — só `name`.
4. [ ] Na entidade, campo anotado só com `@Id` (sem `@Column`).

---

## 15. Erros Comuns

| Erro                                                    | Correção                                                  |
|:--------------------------------------------------------|:----------------------------------------------------------|
| Colocar `description`, `dataType`, `size` no `@Column`  | Somente `name`. Metadata fica no XML.                     |
| Colocar `@GeneratedValue` no `@Id`                      | Sequência fica no XML (`sequenceType`/`sequenceField`).   |
| Colocar `@Expression` no campo                          | Expressões ficam no XML (`<expression>`).                 |
| Omitir `isNativeTable = true` em tabela nativa Sankhya  | Obrigatório para TGFCAB, TGFFIN, TGFORD, TGFVEI, TGFEMP, TGFPAR — KSP rejeita sem ele com erro de entidade duplicada. |
| Omitir `isNativeInstance = true` em instância nativa    | Obrigatório quando o `entity` reusa um nome nativo (`CabecalhoNota`, `Parceiro`, `Produto`, etc.). Sem ele, o deploy regrava a instância para o owner do addon e quebra regras/validações nativas. |
| Criar `@OneToOne` quando só precisa do valor da FK      | Use `@Column(name = "FK")` se não precisa navegar.        |
| Esquecer de criar o XML do dicionário                   | Toda entidade **precisa** do XML correspondente.          |
| Esquecer `@NoArgsConstructor`                           | Obrigatório para o framework instanciar a entidade.       |
| Usar `String` para campo `CHECKBOX`                     | Use `Boolean` — o framework converte S/N automaticamente. |
| Usar `Integer` para PKs nativas (NUNOTA, CODPARC)       | Use `BigDecimal` — padrão do Sankhya Om.                  |


## Related Skills

- `data-dictionary` — XML do dicionário de dados que descreve a tabela mapeada por esta entidade
- `database` — dbscript V<NNN>-*.xml que cria a tabela física no MSSQL/Oracle
- `repository` — interface JapeRepository que opera sobre esta entidade
- `mapstruct` — mapper DTO ↔ entidade
