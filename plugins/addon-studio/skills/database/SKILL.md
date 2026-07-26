---
name: database
description: Cria, audita e padroniza dbscripts Sankhya (`dbscripts/V<NNN>-*.xml`) com migrations dual MSSQL/Oracle. Cobre convenções de nomenclatura, mapeamento de tipos (`NUMBER`/`NUMERIC`/`INT`/`FLOAT`/`DECIMAL`/`VARCHAR`/`VARCHAR2`/`CHAR`/`DATE`/`DATETIME`/`TIMESTAMP`), estrutura `<sql>`/`<mssql>`/`<oracle>` e atributos `executar`/`tipoObjeto`/`nomeObjeto`. Use ao adicionar, alterar, revisar, padronizar ou auditar arquivos em `dbscripts/`, ao mapear tipos entre Oracle e MSSQL, ou ao tocar em SQL com tags `<mssql>`/`<oracle>`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Scripts de Banco de Dados (Addon Studio 2.0)

Instruções para criar/manter scripts migração em `dbscripts/` para projetos Addon Studio 2.0.

---

## Estrutura dos Scripts

Cada arquivo migração = XML versionamento sequencial estilo **Flyway**:

```
dbscripts/
|-- V001-CREATE_TABLE_TDCXYZCAD.xml
|-- V002-CREATE_TABLE_TDCXYZFAT.xml
|-- V003-ALTER_TABLE_TGFCAB.xml
|-- V004-ALTER_TABLE_TDCXYZCAD.xml
|-- V005-INSERT_DATA_TDCXYZCTL.xml
|-- V<NNN>-<OPERACAO>_<TABELA>.xml
```

> Sistema suporta subdiretórios em `dbscripts/`, percorre respeitando prefixos numéricos.

### Convenção de Nomenclatura dos Arquivos

**Padrão:** `V<NNN>-<OPERACAO>_<TABELA>.xml`

| Componente   | Descrição                                                           | Exemplos                                     |
|:-------------|:--------------------------------------------------------------------|:---------------------------------------------|
| `V<NNN>`     | Versão sequencial **3 dígitos** (zero-padded), nunca reutilizar     | `V001`, `V002`, `V003`                       |
| `<OPERACAO>` | Operação principal script                                           | `CREATE_TABLE`, `ALTER_TABLE`, `INSERT_DATA` |
| `<TABELA>`   | Nome tabela afetada                                                 | `TDCXYZCAD`, `TGFCAB`                        |

---

### Formato XML Base

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <sql nomeTabela="NOME_TABELA"
         ordem="N"
         executar="SE_NAO_EXISTIR"
         tipoObjeto="TABLE"
         nomeObjeto="NOME_OBJETO"
         descricao="Descrição do que o script faz">
        <mssql>
            <!-- SQL Server aqui -->
        </mssql>
        <oracle>
            <!-- SQL Oracle aqui -->
        </oracle>
    </sql>

</scripts>
```

### Tags de Banco de Dados

Cada `<sql>` **deve** conter **ambas** tags `<mssql>` e `<oracle>`, SQL equivalente cada banco:

```xml

<mssql>
    CREATE TABLE EXEMPLO (CODEXEMPLO INT NOT NULL, CONSTRAINT PK_EXEMPLO PRIMARY KEY (CODEXEMPLO))
</mssql>
<oracle>
CREATE TABLE EXEMPLO (CODEXEMPLO NUMBER(10) NOT NULL, CONSTRAINT PK_EXEMPLO PRIMARY KEY (CODEXEMPLO))
</oracle>
```

> **Regra:** Todo `<sql>` tem duas tags — `<mssql>` primeiro, `<oracle>` depois. Nunca omitir.
>
> **Nota sobre o schema:** o `scripts.xsd` define `<oracle>`/`<mssql>` como `xs:all` (qualquer ordem, no máximo 1 cada, podendo ter só um dos dois). A regra acima é **convenção do projeto** para garantir portabilidade dual MSSQL/Oracle — não restrição do schema.

### Atributos do Elemento `<sql>`

| Atributo     | Obrigatório | Descrição                                                          | Valores                                       |
|:-------------|:------------|:-------------------------------------------------------------------|:----------------------------------------------|
| `nomeTabela` | Sim         | Tabela afetada (usado em logs)                                     | Nome tabela                                   |
| `ordem`      | Sim         | Ordem execução no arquivo. **Não duplicar** dentro mesmo XML       | Inteiro sequencial (1, 2, 3...)               |
| `executar`   | Sim         | Condição execução                                                  | `SE_NAO_EXISTIR`, `SE_EXISTIR`, `SEMPRE`      |
| `tipoObjeto` | Sim         | Tipo objeto verificado por `executar`                              | `TABLE`, `COLUMN`, `FUNCTION`, `PROCEDURE`, `TRIGGER`, `VIEW`, `CONSTRAINT`, `PRIMARY KEY`, `FOREIGN KEY`, `INDEX` |
| `nomeObjeto` | Sim         | Nome objeto verificado (identificador único versionamento)         | Nome objeto no banco                          |
| `descricao`  | Não         | Descrição textual script (documentação)                            | Texto livre                                   |

### Valores de `executar` — Detalhamento

| Valor            | Comportamento                                                              | Quando usar                                                             |
|:-----------------|:---------------------------------------------------------------------------|:------------------------------------------------------------------------|
| `SE_NAO_EXISTIR` | Executa **se** objeto (`tipoObjeto` + `nomeObjeto`) **não existir** banco | CREATE TABLE, ADD COLUMN — padrão criação objetos novos                 |
| `SE_EXISTIR`     | Executa **se** objeto **já existir** banco                                | ALTER TABLE modificar coluna existente, DROP, migração dados            |
| `SEMPRE`         | Executa **toda vez** deploy, independente existência                      | INSERT/UPDATE dados config, scripts idempotentes. **Usar com cautela**  |

---

## Regras de Nomenclatura

### Nome de Tabela — Convencao parametrizada por projeto

**Padrao obrigatorio:** `<PRX><MOD3><CTX>` — tudo MAIUSCULO, sem underscores.

Componentes:

- `<PRX>`: prefixo fixo do projeto, **3-4 caracteres** UPPER (ex.: `TDC`, `APP`, `CST`)
- `<MOD3>`: sigla do modulo, **3 caracteres** (ex.: `FIN`, `FAT`, `CFG`, `CAD`)
- `<CTX>`: sigla curta do contexto/entidade da tabela (ex.: `CAB`, `ITE`, `CFG`, `LOG`)

#### Descobrir convencao do projeto (obrigatorio antes de criar)

1. **Inspecionar projeto:** procurar tabelas existentes em `dbscripts/*.xml` (`CREATE TABLE`), `datadictionary/*.xml` (`<table name="...">`), entities `@JapeEntity(table = "...")`. Se houver padrao consistente (todas com mesmo prefixo), reusar `<PRX>`.
2. **Se projeto novo / sem padrao:** perguntar ao dev:
   - "Qual prefixo (`<PRX>`, 3-4 chars UPPER) usar para tabelas custom? Ex.: `TDC`, `APP`, `CST`."
   - "Qual sigla 3 chars (`<MOD3>`) representa este modulo? Ex.: `FIN`, `FAT`."
   - "Qual contexto/entidade (`<CTX>`)? Ex.: `CAB`, `ITE`, `CFG`."
3. **Confirmar nome final** antes de gerar artefatos.

Exemplos ilustrativos (`<PRX>`=`TDC`, `<MOD3>`=`XYZ`):

| Conceito       | PRX    | MOD3   | CTX      | Resultado    |
|:---------------|:-------|:-------|:---------|:-------------|
| Cadastro       | `TDC`  | `XYZ`  | `CAD`    | `TDCXYZCAD`  |
| Faturamento    | `TDC`  | `XYZ`  | `FAT`    | `TDCXYZFAT`  |
| Configuracao   | `TDC`  | `XYZ`  | `CFG`    | `TDCXYZCFG`  |
| Cabecalho nota | `TDC`  | `XYZ`  | `CAB`    | `TDCXYZCAB`  |
| Item nota      | `TDC`  | `XYZ`  | `ITE`    | `TDCXYZITE`  |

> **NOTA:** exemplos abaixo usam `TDC` como prefixo ilustrativo. Substituir pelo `<PRX>` real do projeto.

### Nome de Constraint

| Tipo  | Padrao                     | Exemplo                                       |
|:------|:---------------------------|:----------------------------------------------|
| PK    | `PK_<NOME_TABELA>`         | `CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)` |
| CHECK | `CK_<NOME_TABELA>_<COLUNA>` | `CONSTRAINT CK_TDCXYZCAD_ATIVO CHECK (ATIVO IN ('S', 'N'))` |

```sql
CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
CONSTRAINT PK_TDCXYZFAT PRIMARY KEY (CODPARC, DTFAT)
```

> **Oracle limita identificadores a 30 caracteres** (ate 12.1). `CK_<TABELA>_<COLUNA>` com nomes longos estoura — encurtar o sufixo e **confirmar com o dev**, nunca truncar em silencio.

### Nome de Campos

**Padrao:** MAIUSCULO, sem underscores (excecoes compostos).

Abreviacoes padrao ecossistema Sankhya:

| Prefixo      | Significado                         | Exemplo                                 |
|:-------------|:------------------------------------|:----------------------------------------|
| `COD`        | Codigo (identificador)              | `CODPARC`, `CODUSU`                     |
| `DT`         | Data (sem hora)                     | `DTFAT`, `DTINC`                        |
| `DH`         | Data/Hora (com timestamp)           | `DHINC`, `DHREC`, `DHALTER`, `DHCREATE` |
| `VLR`        | Valor monetario                     | `VLRMRR`, `VLRTOTAL`                    |
| `QTD`        | Quantidade                          | `QTDTOTAL`, `QTDEXC`                    |
| `PERC`       | Percentual                          | `PERCMRR`                               |
| `DESCR`      | Descricao (texto livre)             | `DESCRERRO`, `DESCRPRODUTO`             |
| `NU`         | Numero unico movimentos/documentos  | `NUNOTA`, `NUIMP`, `NUPED`              |
| `<MOD>_`     | Coluna customizada em tabela nativa | `XYZ_CODRECEITA`, `XYZ_STATUS`          |

> **Colunas customizadas em tabelas nativas Sankhya** (ex: `TGFCAB`) usam prefixo do **modulo** do addon + `_` (ex: `<MOD>_NOMECAMPO`) para evitar conflito com core Sankhya e com outros addons. Nunca usar prefixo generico tipo `AD_`.

> **Chaves primarias sequenciais:** nao usar prefixo `ID`. Para **cadastros**, usar `COD` (ex: `CODCAD`, `CODCFG`); para **movimentos/documentos**, usar `NU` (ex: `NUNOTA`, `NUIMP`).

> **Quem gera a PK e o dicionario, nao o banco.** Toda tabela nova do addon nasce com PK automatica (`sequenceType="A"` no `datadictionary/`, ver skill `data-dictionary`) — inclusive config, log, registro e tabela de apoio. No DDL a coluna PK e `NUMBER(10)`/`INT` simples: **sem** `IDENTITY`, `GENERATED AS IDENTITY`, `CREATE SEQUENCE` ou trigger de sequencia.

---

## Tipos de Dados

### Mapeamento por Banco

| Tipo lógico | Oracle         | SQL Server      | Uso                                       |
|:------------|:---------------|:----------------|:------------------------------------------|
| Inteiro     | `NUMBER(10)`   | `INT`           | `COD*`/`NU*` sequenciais, contadores, FKs |
| Decimal     | `FLOAT(126)`   | `FLOAT(53)`     | Valores monetários, percentuais           |
| Texto       | `VARCHAR2(n)`  | `VARCHAR(n)`    | Texto tamanho variável                    |
| Flag S/N    | `VARCHAR2(1)`  | `CHAR(1)`       | Flags booleanas                           |
| Data/Hora   | `DATE`         | `DATETIME`      | Data e/ou data+hora                       |

> **Decimal é `FLOAT`, não `DECIMAL`/`NUMBER(18,N)`.** Tabelas nativas Sankhya usam `FLOAT` nos dois bancos (`FLOAT(126)` Oracle, `FLOAT(53)` SQL Server), sem escala na coluna. Casas decimais são do dicionário (`nuCasasDecimais`), não do DDL. Coluna de addon segue o nativo: mesmo tipo em JOIN/comparação com tabela nativa, e JAPE lê como `BigDecimal` do mesmo jeito.
>
> **Cuidado:** o nome é igual, a precisão não. Oracle `FLOAT(126)` é subtipo de `NUMBER` — decimal exato. SQL Server `FLOAT(53)` é IEEE 754 binário — sujeito a resíduo de arredondamento. Em cálculo financeiro, arredondar no Java com `BigDecimal`; nunca comparar `FLOAT` por igualdade exata em SQL.

### Diferenças de Sintaxe

| Operação           | Oracle                            | SQL Server                            |
|:-------------------|:----------------------------------|:--------------------------------------|
| CREATE TABLE       | Igual                             | Igual (usar tipos SQL Server)         |
| ALTER TABLE ADD    | `ALTER TABLE X ADD (COL TYPE)`    | `ALTER TABLE X ADD COL TYPE`          |
| ALTER TABLE MODIFY | `ALTER TABLE X MODIFY (COL TYPE)` | `ALTER TABLE X ALTER COLUMN COL TYPE` |
| INSERT sem tabela  | `SELECT 1 FROM DUAL`              | `SELECT 1`                            |

> **Nota:** Oracle `DATE` guarda data+hora. SQL Server usar `DATETIME` mesmo efeito.

---

## Filosofia: CREATE TABLE Mínimo + ALTER TABLE por Coluna

`CREATE TABLE` contém **só colunas PK + constraint**. Demais colunas adicionadas individualmente via `ALTER TABLE ADD` mesmo arquivo XML. Garante:

- Scripts atômicos, fáceis auditar
- Granularidade rollback/diagnóstico
- Padrão único (`ALTER TABLE ADD`) tabelas novas e tabelas nativas

---

## Padrões de Script por Operação

Padrões completos de DDL — `CREATE TABLE` mínimo (somente PK + constraint), `ALTER TABLE` para adicionar/modificar colunas (uma por `<sql>`), CHECK constraints para `LISTA`/`CHECKBOX`, tabelas nativas (`nativeTable`), relação dicionário ↔ scripts e `INSERT` para dados de configuração — em [`references/script-patterns.md`](references/script-patterns.md).

---

## Mapeamento Dicionário de Dados -> Tipos de Banco (Referência)

| `dataType` no dicionário          | Oracle                  | SQL Server              | Observação                           |
|:----------------------------------|:------------------------|:------------------------|:-------------------------------------|
| `INTEIRO`                         | `NUMBER(10)`            | `INT`                   |                                      |
| `TEXTO` (com `size`)              | `VARCHAR2(<size>)`      | `VARCHAR(<size>)`       |                                      |
| `DECIMAL` (com `nuCasasDecimais`) | `FLOAT(126)`            | `FLOAT(53)`             | Escala **não** vai na coluna — `nuCasasDecimais` manda |
| `DATA_HORA` ou `DATA`             | `DATE`                  | `DATETIME`              |                                      |
| `CHECKBOX`                        | `VARCHAR2(1)`           | `CHAR(1)`               | **+ CHECK `IN ('S', 'N')`**          |
| `LISTA` (com `<fieldOptions>`)    | `VARCHAR2(<size>)`      | `VARCHAR(<size>)`       | **+ CHECK `IN (<values das options>)`** |
| `PESQUISA`                        | Depende do `targetType` | Depende do `targetType` | Ex: `INTEIRO` -> `NUMBER(10)` / `INT` |

### CHECK Constraints — Domínio Fechado

Campo `LISTA` (valores das `<option>`) e campo `CHECKBOX` (`'S'`/`'N'`) geram **CHECK constraint** em `<sql>` próprio, logo após o `ALTER TABLE ADD` da coluna. Nome: `CK_<TABELA>_<COLUNA>`, com `tipoObjeto="CONSTRAINT"`.

```xml
<sql nomeTabela="TDCXYZCAD" ordem="6" executar="SE_NAO_EXISTIR"
     tipoObjeto="CONSTRAINT" nomeObjeto="CK_TDCXYZCAD_ATIVO"
     descricao="Restringir o campo ATIVO aos valores S e N">
    <mssql>
        ALTER TABLE TDCXYZCAD ADD CONSTRAINT CK_TDCXYZCAD_ATIVO CHECK (ATIVO IN ('S', 'N'))
    </mssql>
    <oracle>
        ALTER TABLE TDCXYZCAD ADD CONSTRAINT CK_TDCXYZCAD_ATIVO CHECK (ATIVO IN ('S', 'N'))
    </oracle>
</sql>
```

Padrões completos — `LISTA`, tabela nativa, evolução das opções (DROP + recreate) — em [`references/script-patterns.md`](references/script-patterns.md).

### Mapeamento Banco -> Tipo do Dicionário (inverso)

| Oracle         | SQL Server                  | Tipo Dicionário          | Condição                   |
|:---------------|:----------------------------|:---------------------------|:---------------------------|
| `NUMBER(10)`   | `INT`                       | `INTEIRO`                  | Sem FK                     |
| `NUMBER(10)`   | `INT`                       | `PESQUISA`                 | Com relacionamento (FK)    |
| `FLOAT(126)`   | `FLOAT(53)`                 | `DECIMAL`                  | Com casas decimais         |
| `NUMBER(18,N)` | `DECIMAL(18,N)`             | `DECIMAL`                  | Legado — coluna antiga, ler normal; não usar em coluna nova |
| `VARCHAR2(n)`  | `VARCHAR(n)`                | `TEXTO` size=n             | Texto livre, sem CHECK     |
| `VARCHAR2(n)` + CHECK `IN (...)` | `VARCHAR(n)` + CHECK `IN (...)` | `LISTA` + `<fieldOptions>` | Enum valores definidos |
| `VARCHAR2(1)` + CHECK `IN ('S','N')` | `CHAR(1)` + CHECK `IN ('S','N')` | `CHECKBOX`      | Flag booleana              |
| `DATE`         | `DATETIME` (só data)        | `DATA`                     | Semântica: só data         |
| `DATE`         | `DATETIME` (com hora)       | `DATA_HORA`                | Semântica: data + hora     |

---

## Anti-patterns (PROIBIDO)

### 1. Omitir uma das tags de banco

```xml
<!-- ERRADO — falta <mssql> -->
<sql ...>
<oracle>
CREATE TABLE TABELA (CODCAD NUMBER(10) NOT NULL, CONSTRAINT PK_TABELA PRIMARY KEY (CODCAD))
</oracle>
    </sql>

    <!-- CORRETO — ambas as tags presentes -->
<sql ...>
<mssql>
CREATE TABLE TABELA (CODCAD INT NOT NULL, CONSTRAINT PK_TABELA PRIMARY KEY (CODCAD))
</mssql>
<oracle>
CREATE TABLE TABELA (CODCAD NUMBER(10) NOT NULL, CONSTRAINT PK_TABELA PRIMARY KEY (CODCAD))
</oracle>
    </sql>
```

### 2. Ponto-e-vírgula no final do SQL

```xml
<!-- ERRADO -->
<oracle>
    CREATE TABLE TABELA (CODCAD NUMBER(10) NOT NULL, CONSTRAINT PK_TABELA PRIMARY KEY (CODCAD));
</oracle>

    <!-- CORRETO -->
<oracle>
CREATE TABLE TABELA (CODCAD NUMBER(10) NOT NULL, CONSTRAINT PK_TABELA PRIMARY KEY (CODCAD))
</oracle>
```

> Sistema adiciona terminador automaticamente. Ponto-e-vírgula causa erro execução.

### 3. CREATE TABLE com todas as colunas

```xml
<!-- ERRADO — todas as colunas no CREATE TABLE -->
<oracle>
    CREATE TABLE TDCXYZCAD (
    CODCAD NUMBER(10) NOT NULL,
    DESCR VARCHAR2(200),
    CODPARC NUMBER(10),
    ATIVO VARCHAR2(1),
    CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
    )
</oracle>

    <!-- CORRETO | CREATE TABLE só com PK + constraint -->
<oracle>
CREATE TABLE TDCXYZCAD (
CODCAD NUMBER(10) NOT NULL,
CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
)
</oracle>
    <!-- Seguido de ALTER TABLE ADD para cada coluna não-PK -->
```

### 4. CREATE TABLE para tabela nativa

```xml
<!-- ERRADO | tabela nativa não deve ter CREATE TABLE -->
<oracle>
    CREATE TABLE TGFCAB (...)
</oracle>

    <!-- CORRETO | apenas ALTER TABLE para colunas customizadas do addon -->
<oracle>
ALTER TABLE TGFCAB ADD (XYZ_CODRECEITA VARCHAR2(100))
</oracle>
```

### 5. ALTER TABLE para coluna nativa em tabela nativa

```xml
<!-- ERRADO | CODPARC já existe na TGFCAB, é coluna nativa -->
<oracle>
    ALTER TABLE TGFCAB ADD (CODPARC NUMBER(10))
</oracle>

    <!-- CORRETO | somente colunas customizadas com prefixo do addon -->
<oracle>
ALTER TABLE TGFCAB ADD (XYZ_CODRECEITA VARCHAR2(100))
</oracle>
```

### 6. Modificar estrutura de colunas nativas do Sankhya

**NUNCA** alterar tabelas ERP core. Pode **adicionar** colunas com prefixo addon, mas **nunca** modificar/remover colunas existentes.

### 7. Usar prefixo genérico `AD_`

Usar sempre prefixo específico addon (ex: `XYZ_`), nunca `AD_` — causa conflitos com outros add-ons.

### 8. Duplicar `ordem` dentro do mesmo arquivo

Cada `<sql>` no mesmo XML **deve** ter `ordem` único. Duplicados causam comportamento imprevisível.

### 9. Alterar scripts já aplicados

Scripts migração **imutáveis** após deploy. Sempre criar novo `V<N+1>_<OPERACAO>_<TABELA>.xml`.

### 10. Declarar FOREIGN KEY constraints no DDL

Relacionamentos entre tabelas definidos **exclusivamente** em `datadictionary/` via `PESQUISA`. Não usar `FOREIGN KEY` ou `REFERENCES` no SQL.

### 11. Campo de domínio fechado sem CHECK

```xml
<!-- ERRADO — campo LISTA/CHECKBOX sem constraint: banco aceita qualquer valor -->
<oracle>
    ALTER TABLE TDCXYZCAD ADD (ATIVO VARCHAR2(1))
</oracle>

    <!-- CORRETO — ALTER TABLE ADD seguido de <sql> com a CHECK -->
<oracle>
ALTER TABLE TDCXYZCAD ADD (ATIVO VARCHAR2(1))
</oracle>
    <!-- + <sql tipoObjeto="CONSTRAINT" nomeObjeto="CK_TDCXYZCAD_ATIVO"> com CHECK (ATIVO IN ('S', 'N')) -->
```

> `<fieldOptions>` e `CHECKBOX` restringem a **UI**. Sem CHECK, integração/listener/SQL direto grava valor fora do domínio.

### 12. CHECK dentro do `ALTER TABLE ADD` da coluna

```xml
<!-- ERRADO — constraint no mesmo <sql> da coluna: executar/tipoObjeto só verifica um objeto -->
<oracle>
    ALTER TABLE TDCXYZCAD ADD (ATIVO VARCHAR2(1) CHECK (ATIVO IN ('S', 'N')))
</oracle>
```

> Um `<sql>` = um objeto. Constraint junto da coluna gera nome auto (`SYS_C00…` no Oracle), impossível de referenciar em DROP depois — e `executar="SE_NAO_EXISTIR"` com `tipoObjeto="COLUMN"` pula a CHECK se a coluna já existir.

### 13. Versionamento fora do padrão

```
<!-- ERRADO -->
V1.xml
V2.xml
script_tabela.xml

<!-- CORRETO -->
V001-CREATE_TABLE_TDCXYZCAD.xml
V002-CREATE_TABLE_TDCXYZFAT.xml
V003-ALTER_TABLE_TGFCAB.xml
```

---

## Regras de Migração

1. **Nunca alterar scripts já aplicados** — crie novo `V<NNN>-<OPERACAO>_<TABELA>.xml`
2. **Versionamento Flyway** — arquivos `V<NNN>-<OPERACAO>_<TABELA>.xml`
3. **Dual-tag obrigatório** — todo `<sql>` com **ambas** tags `<mssql>` e `<oracle>`, nesta ordem
4. **`autoDDL=false`** — toda alteração schema exige script manual em `dbscripts/`
5. **Encoding** — sempre `ISO-8859-1` no XML
6. **Schema XSD** — referência: `xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd"`
7. **FKs não declaradas no DDL** — relacionamentos só em `datadictionary/` via `PESQUISA`
8. **Ordem de criação** — tabelas referenciadas criadas antes das que referenciam
9. **CREATE TABLE mínimo** — **só** colunas PK + constraint PK
10. **Colunas via ALTER TABLE** — cada coluna não-PK adicionada individualmente via `ALTER TABLE ADD`
11. **Tabelas nativas sem CREATE** — `<nativeTable>` no dicionário = só ALTER TABLE para colunas customizadas (prefixo addon)
12. **Campos auditoria** — `DHALTER DATE`, `DHCREATE DATE` e `CODUSU NUMBER(10)` **opcionais**. Perguntar usuário se deseja incluir
13. **Sem ponto-e-vírgula** — não colocar `;` no final SQL
14. **`ordem` única** — cada `<sql>` no mesmo arquivo com `ordem` distinta
15. **Não alterar tabelas nativas** — só adicionar colunas customizadas com prefixo addon
16. **Prefixo coluna customizada** — usar `<PREFIXO_ADDON>_` em colunas adicionadas em tabelas nativas
17. **PK sequencial sem `ID`** — usar `COD*` para cadastros e `NU*` para movimentos/documentos
18. **CHECK para domínio fechado** — campo `LISTA` (valores das `<option>`) e `CHECKBOX` (`'S'`/`'N'`) exigem `CK_<TABELA>_<COLUNA>` em `<sql>` próprio, `tipoObjeto="CONSTRAINT"`, após o `ALTER TABLE ADD` da coluna
19. **CHECK imutável** — mudar opções = DROP + recreate em novo `V<NNN>`, com `UPDATE` de migração antes se houver dado fora do novo domínio
20. **Seed nunca fixa PK literal** — tabela do addon tem PK automática (dicionário), então `INSERT` de dados iniciais deriva a chave (`MAX(<PK>)+1`) e usa `WHERE NOT EXISTS` pela **chave de negócio**, nunca pela PK. Registro único de configuração: preferir que nasça pela tela/aplicação, sem seed

---

## Exemplos Completos

Exemplos completos de XMLs — `V001-CREATE_TABLE_TDCXYZCAD.xml` (PK simples), `V002-CREATE_TABLE_TDCXYZFAT.xml` (PK composta), `V003-ALTER_TABLE_TGFCAB.xml` (tabela nativa) e `V005-INSERT_DATA_TDCXYZCTL.xml` (dados iniciais com PK derivada) — em [`references/examples.md`](references/examples.md).

---

## Checklists

### Tabela nova (`<table>` no dicionário)

- [ ] Verificar último `V<NNN>-*.xml` existente para definir `N+1` (3 dígitos, zero-padded)
- [ ] Nomear arquivo `V<NNN>-CREATE_TABLE_<TABELA>.xml`
- [ ] Confirmar nome tabela com usuário
- [ ] CREATE TABLE com **só** colunas PK + `CONSTRAINT PK_<TABELA>`
- [ ] Incluir **ambas** tags `<mssql>` e `<oracle>` em cada `<sql>`
- [ ] ALTER TABLE ADD para **cada** coluna não-PK (um `<sql>` por coluna)
- [ ] CHECK constraint (`<sql>` próprio, `tipoObjeto="CONSTRAINT"`) para **cada** campo `LISTA` e `CHECKBOX`
- [ ] Nome da CHECK = `CK_<TABELA>_<COLUNA>`, dentro do limite de 30 chars do Oracle
- [ ] `ordem` única e sequencial no arquivo
- [ ] **Não colocar ponto-e-vírgula** no final SQL
- [ ] **Perguntar usuário** se deseja incluir campos auditoria (`DHALTER`, `DHCREATE`, `CODUSU`)
- [ ] Não declarar `FOREIGN KEY` constraints (FKs definidas no datadictionary)
- [ ] Incluir atributo `descricao` para documentação script
- [ ] Atualizar datadictionary correspondente após criar script

### Tabela nativa (`<nativeTable>` no dicionário)

- [ ] Verificar último `V<NNN>-*.xml` existente para definir `N+1` (3 dígitos, zero-padded)
- [ ] Nomear arquivo `V<NNN>-ALTER_TABLE_<TABELA>.xml`
- [ ] **NÃO** criar CREATE TABLE
- [ ] ALTER TABLE ADD **só** para colunas com prefixo addon (ex: `XYZ_`)
- [ ] CHECK constraint para campos `LISTA`/`CHECKBOX` — **só** nas colunas do addon, nunca em coluna nativa
- [ ] Incluir **ambas** tags `<mssql>` e `<oracle>` em cada `<sql>`
- [ ] Ignorar colunas nativas (sem prefixo addon) — já existem no banco
- [ ] `ordem` única e sequencial no arquivo
- [ ] **Não colocar ponto-e-vírgula** no final SQL
- [ ] Incluir atributo `descricao` para documentação script

### Adição de coluna em tabela existente (evolução)

- [ ] Verificar último `V<NNN>-*.xml` existente para definir `N+1` (3 dígitos, zero-padded)
- [ ] Nomear arquivo `V<NNN>-ALTER_TABLE_<TABELA>.xml`
- [ ] ALTER TABLE ADD com `executar="SE_NAO_EXISTIR"` e `tipoObjeto="COLUMN"`
- [ ] Incluir **ambas** tags `<mssql>` e `<oracle>` em cada `<sql>`
- [ ] `ordem` única e sequencial no arquivo
- [ ] **Não colocar ponto-e-vírgula** no final SQL

### Alteração de CHECK constraint (mudou `<fieldOptions>` de campo já deployado)

- [ ] **Nunca** editar o `V<NNN>` que criou a CHECK — script aplicado é imutável (regra 9)
- [ ] Verificar último `V<NNN>-*.xml` existente para definir `N+1` (3 dígitos, zero-padded)
- [ ] Nomear arquivo `V<NNN>-ALTER_CONSTRAINT_<TABELA>.xml`
- [ ] DROP CONSTRAINT com `executar="SE_EXISTIR"` (`ordem` 1)
- [ ] Opção **removida** do domínio: `UPDATE` de migração do dado antigo antes do ADD — **perguntar ao dev** o valor de destino
- [ ] ADD CONSTRAINT com opções novas e `executar="SE_NAO_EXISTIR"` (última `ordem`)
- [ ] Atualizar `<fieldOptions>` no datadictionary para refletir o mesmo domínio

### Dados iniciais (seed)

- [ ] Verificar último `V<NNN>-*.xml` existente para definir `N+1` (3 dígitos, zero-padded)
- [ ] Nomear arquivo `V<NNN>-INSERT_DATA_<TABELA>.xml` (ex: `V005-INSERT_DATA_TDCXYZCTL.xml`)
- [ ] Usar `executar="SEMPRE"` com `INSERT ... WHERE NOT EXISTS` ou `MERGE` para idempotência
- [ ] PK derivada de `MAX(<PK>)+1` (`COALESCE` no MSSQL, `NVL` no Oracle) — **nunca** valor literal, a sequência é do dicionário
- [ ] `WHERE NOT EXISTS` pela **chave de negócio** do registro, não pela PK
- [ ] Registro único de configuração: não semear — deixar nascer pela tela/aplicação


## Skills relacionadas

- `entity` — entidade `@JapeEntity` da tabela criada por este dbscript
- `data-dictionary` — XML do dicionário que descreve os metadados da tabela
- `macros` — macros SQL **não** se aplicam a dbscripts (ver `macros` §7); portabilidade Oracle/MSSQL aqui é via split `<mssql>`/`<oracle>`
