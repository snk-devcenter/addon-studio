---
name: macros
description: Macros SQL do MacroTranslator Sankhya (`dbDate`, `nullValue`, `ignorecase`, `normalizeText`, `truncMonth`, `yearMonth`, `addMonths`) para portabilidade Oracle/MSSQL. Use ao escrever, revisar, auditar ou portar SQL em `queries/`, `datadictionary/`, dbscripts ou `@NativeQuery`, ao identificar oportunidades de substituir SQL específico de banco por macro, ou ao diagnosticar diferenças de comportamento entre Oracle e MSSQL.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Macros SQL Sankhya (MacroTranslator) — Addon Studio 2.0

Macros SQL traduzidas automaticamente entre Oracle e MSSQL pelo framework Sankhya. Permite escrever queries portáveis sem duplicar sintaxe por banco.

> **Onde aparecem:**
> - `<expression>` em metadata XML (`datadictionary/`) — quando contem SQL
> - `selectQuery` em `<fieldOptions>` (lookup customizado)
> - `@Criteria(clause = "...")` em `@Repository`
> - `@NativeQuery("...")` em `@Repository`
> - Queries externas em `model/src/main/resources/queries/*.sql` ou `queries/*.xml`
>
> **Nao confundir com BeanShell**: variaveis `$col_<COLUNA>`, `$ctx_usuario_logado`, `$ctx_dh_atual` sao contexto **BeanShell** em `<expression>` — nao sao macros SQL. Ver `data-dictionary` §1.8.

---

## 1. Por que usar macros

- **Sintaxe unificada** Oracle/MSSQL — escrita uma vez, traduzida automaticamente
- **Centraliza diferencas** de banco em um unico ponto
- **Reduz risco** de query funcionar em um banco e quebrar no outro
- **Manutencao** em um lugar so (sem ramificacoes por banco)

---

## 2. Referencia por categoria

### 2.1 Data e hora

| Macro                          | Proposito                                          | Exemplo                          |
|:-------------------------------|:---------------------------------------------------|:---------------------------------|
| `dbDate()`                     | Data/hora atual do banco (`SYSDATE`/`GETDATE()`)   | `WHERE DTMOV = dbDate()`         |
| `onlydate(<data>)`             | Apenas a data (sem hora)                           | `onlydate(DATA_VENDA)`           |
| `truncDate(<data>)`            | Apenas a data (similar a `onlydate`)               | `truncDate(DATA)`                |
| `truncWeek(<data>)`            | Inicio da semana                                   | `truncWeek(DATA)`                |
| `truncMonth(<data>)`           | Inicio do mes                                      | `truncMonth(DATA)`               |
| `truncQarter(<data>)`          | Inicio do trimestre (nome com typo no SDK: `Qarter`)| `truncQarter(DATA)`             |
| `truncYear(<data>)`            | Inicio do ano                                      | `truncYear(DATA)`                |
| `getDay(<data>)`               | Dia (1-31)                                         | `getDay(DATA)`                   |
| `getMonth(<data>)`             | Mes (1-12)                                         | `getMonth(DATA)`                 |
| `getYear(<data>)`              | Ano (`YYYY`)                                       | `getYear(DATA)`                  |
| `monYear(<data>)`              | Mes/ano formato `MM/YYYY`                          | `monYear(DATA)`                  |
| `yearMonth(<data>)`            | Ano+mes formato `YYYYMM` (numerico)                | `yearMonth(DATA)`                |
| `addMonths(<data>, <qtd>)`     | Soma N meses a data                                | `addMonths(DATA, 3)`             |
| `endOfCurrentMonth()`          | Ultimo dia do mes atual                            | `endOfCurrentMonth()`            |
| `diffdays(<dt1>, <dt2>)`       | Diferenca em dias (`dt1 - dt2`)                    | `diffdays(DTFIM, DTINI)`         |
| `diffhour(<dt1>, <dt2>)`       | Diferenca em horas (`dt1 - dt2`)                   | `diffhour(DTFIM, DTINI)`         |
| `convertPtBrDate(<data>)`      | Data como string `DD/MM/YYYY`                      | `convertPtBrDate(DATA)`          |

### 2.2 Texto

| Macro                                | Proposito                                       | Exemplo                                   |
|:-------------------------------------|:------------------------------------------------|:------------------------------------------|
| `ignorecase(<expr>)`                 | Compara sem case e sem acentos                  | `ignorecase(NOME) = ignorecase('Jose')`   |
| `normalizeText(<expr>)`              | Remove acentos + UPPER (busca tolerante)        | `normalizeText(NOME) LIKE '%SILVA%'`      |
| `upperText(<expr>)`                  | Converte para maiusculas                        | `upperText(NOME)`                         |
| `trim(<expr>)`                       | Remove espacos nas pontas                       | `trim(NOME)`                              |
| `length(<expr>)`                     | Tamanho da string                               | `length(NOME)`                            |
| `subString(<col>, <ini>, <fim>)`     | Recorte de string                               | `subString(NOME, 1, 5)`                   |
| `stringIndex(<src>, <trg>)`          | Posicao de substring (1-based)                  | `stringIndex(NOME, 'A')`                  |
| `leftPad(<col>, <char>, <tam>)`      | Preenche a esquerda ate atingir tamanho         | `leftPad(CODIGO, '0', 8)`                 |
| `concatstr(<a>, <b>)`                | Concatena duas strings (`||` Oracle / `+` MSSQL)| `concatstr(NOME, SOBRENOME)`              |
| `quebraLinha()`                      | Quebra de linha (`CRLF`)                        | `concatstr(NOME, quebraLinha())`          |

### 2.3 Conversao de tipos

| Macro                            | Proposito                              | Exemplo                       |
|:---------------------------------|:---------------------------------------|:------------------------------|
| `convertToNumber(<expr>)`        | Converte para `NUMERIC`/`NUMBER`       | `convertToNumber(PRECO)`      |
| `convertToFloat(<expr>)`         | Converte para `FLOAT`                  | `convertToFloat(VALOR)`       |
| `convertToVarchar(<expr>)`       | Converte para `VARCHAR`                | `convertToVarchar(CODIGO)`    |
| `convertToTimestamp(<expr>)`     | Converte para `TIMESTAMP`/`DATETIME`   | `convertToTimestamp(STR_DATA)`|
| `convertToMilliseconds(<expr>)`  | Extrai milissegundos                   | `convertToMilliseconds(DATA)` |

### 2.4 Outros

| Macro                              | Proposito                                            | Exemplo                              |
|:-----------------------------------|:-----------------------------------------------------|:-------------------------------------|
| `nullValue(<expr>, <padrao>)`      | `NVL`/`ISNULL`: substitui null por padrao            | `nullValue(SALARIO, 0)`              |
| `maxLines(<qtd>)`                  | Limita linhas (`ROWNUM` Oracle / `TOP` MSSQL)        | `SELECT maxLines(10) * FROM TGFCAB`  |
| `${user.name}`                     | Owner/usuario do banco (prefixo de tabela)           | `SELECT * FROM ${user.name}TABELA`   |
| `sqldatabase.<tabela>`             | Qualifica tabela com nome do banco/schema            | `SELECT * FROM sqldatabase.CLIENTES` |

---

## 3. Uso em `<expression>` SQL (datadictionary)

Algumas `<expression>` em metadata podem conter **SQL** (nao BeanShell). Macros SQL valem aqui:

```xml
<field name="DTREF" dataType="DATA_HORA" allowSearch="N" visibleOnSearch="N">
    <description>Data Referencia</description>
    <expression><![CDATA[truncMonth(dbDate())]]></expression>
</field>

<field name="VLRTOTAL_NN" dataType="DECIMAL" calculated="S" allowSearch="N" visibleOnSearch="N">
    <description>Vlr Total (Tratado)</description>
    <expression><![CDATA[nullValue(VLRTOTAL, 0)]]></expression>
</field>
```

> Para `<expression>` **BeanShell** (mais comum em campos com `$col_*`/`$ctx_*`), use as variaveis de contexto BeanShell — **nao** macros SQL. Ver `data-dictionary` §1.8.

---

## 4. Uso em `@Criteria` / `@NativeQuery`

```java
// Busca tolerante a acento e case
@Criteria(clause = "ignorecase(this.NOMEPARC) = ignorecase(:nome)")
List<Parceiro> findByNome(@Parameter("nome") String nome);

// Filtro por data atual do servidor
@Criteria(clause = "this.DTMOV = dbDate()")
List<Movimentacao> findHoje();

// Agrupamento por competencia (ano+mes)
@NativeQuery("SELECT yearMonth(DTNEG) AS COMP, SUM(VLRNOTA) AS TOTAL " +
             "FROM TGFCAB GROUP BY yearMonth(DTNEG)")
List<CompetenciaDTO> agruparPorCompetencia();

// Tratamento de null
@NativeQuery("SELECT nullValue(VLRDESCONTO, 0) FROM TGFCAB WHERE NUNOTA = :nu")
BigDecimal descontoOrZero(@Parameter("nu") Long nu);

// Limite de linhas portatil
@NativeQuery("SELECT maxLines(10) NUNOTA, VLRNOTA FROM TGFCAB ORDER BY DTNEG DESC")
List<NotaResumo> ultimas10();
```

---

## 5. Uso em queries externas (`queries/*.sql`)

Macros tambem funcionam em arquivos externos referenciados via `fromFile = true`:

```sql
-- queries/ranking-vendedores.sql
SELECT VEND.CODVEND, VEND.NOMEVEND,
       SUM(nullValue(CAB.VLRNOTA, 0)) AS TOTAL,
       getYear(CAB.DTNEG) AS ANO
FROM TGFCAB CAB
INNER JOIN TGFVEN VEND ON VEND.CODVEND = CAB.CODVEND
WHERE truncMonth(CAB.DTNEG) = truncMonth(dbDate())
  AND ignorecase(VEND.NOMEVEND) LIKE ignorecase(:nome)
GROUP BY VEND.CODVEND, VEND.NOMEVEND, getYear(CAB.DTNEG)
```

---

## 6. Anti-Patterns (PROIBIDO)

| Anti-Pattern                                              | Correcao                                            |
|:----------------------------------------------------------|:----------------------------------------------------|
| Usar `SYSDATE`/`GETDATE()` direto                         | `dbDate()`                                          |
| Usar `NVL`/`ISNULL` direto                                | `nullValue(<expr>, <padrao>)`                       |
| Usar `ROWNUM`/`TOP` direto                                | `maxLines(<qtd>)`                                   |
| Concatenacao com `||` ou `+`                              | `concatstr(<a>, <b>)`                               |
| `UPPER(...)` sem tratar acentos em busca textual          | `normalizeText(<expr>)` ou `ignorecase(<expr>)`     |
| `INSTR`/`CHARINDEX` direto                                | `stringIndex(<src>, <trg>)`                         |
| `TO_NUMBER`/`CONVERT(NUMERIC, ...)` direto                | `convertToNumber(<expr>)`                           |
| `TO_CHAR(...)`/`CONVERT(VARCHAR, ...)` direto             | `convertToVarchar(<expr>)` ou `convertPtBrDate(...)`|
| `LPAD`/`RIGHT(REPLICATE(...))` direto                     | `leftPad(<col>, <char>, <tam>)`                     |
| `SUBSTR`/`SUBSTRING` direto                               | `subString(<col>, <ini>, <fim>)`                    |
| `ADD_MONTHS`/`DATEADD(MONTH, ...)` direto                 | `addMonths(<data>, <qtd>)`                          |
| `LAST_DAY(SYSDATE)`/`EOMONTH(GETDATE())`                  | `endOfCurrentMonth()`                               |

---

## 7. Quando NAO usar macro

- **Operacao muito especifica** de um banco sem equivalente no outro (ex.: window function avancada Oracle-only). Nesses casos, separar em `queries/<arquivo>.xml` com tags `<oracle>` e `<mssql>`. Ver `repository` §4.
- **Logica em `<expression>` BeanShell** (nao SQL). Use variaveis de contexto BeanShell (`$col_*`, `$ctx_*`).
- **DDL** em `dbscripts/` — scripts de banco ja sao split via tags `<mssql>`/`<oracle>`. Macros nao se aplicam ali.


## Related Skills

- `data-dictionary` — macros usadas em campo `<expression>` quando contém SQL (não BeanShell)
- `database` — macros usadas em dbscripts para portabilidade Oracle/MSSQL
- `repository` — macros usadas em `@NativeQuery` e `queries/<arquivo>.xml`

## Skills relacionadas

- `database` — dbscripts dual MSSQL/Oracle que usam macros
- `data-dictionary` — campo `<expression>` portável
- `repository` — `@NativeQuery` portável
