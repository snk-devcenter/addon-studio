---
name: database
description: Create Sankhya dbscripts (`dbscripts/V<NNN>-*.xml`) with dual MSSQL/Oracle migrations and naming conventions. Use when adding or altering tables in `dbscripts/`.
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
|-- V005-INSERT_DATA_TDCXYZCFG.xml
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

### Atributos do Elemento `<sql>`

| Atributo     | Obrigatório | Descrição                                                          | Valores                                       |
|:-------------|:------------|:-------------------------------------------------------------------|:----------------------------------------------|
| `nomeTabela` | Sim         | Tabela afetada (usado em logs)                                     | Nome tabela                                   |
| `ordem`      | Sim         | Ordem execução no arquivo. **Não duplicar** dentro mesmo XML       | Inteiro sequencial (1, 2, 3...)               |
| `executar`   | Sim         | Condição execução                                                  | `SE_NAO_EXISTIR`, `SE_EXISTIR`, `SEMPRE`      |
| `tipoObjeto` | Sim         | Tipo objeto verificado por `executar`                              | `TABLE`, `COLUMN`, `VIEW`, `INDEX`, `TRIGGER` |
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

### Nome de Constraint (PK)

**Padrao:** `PK_<NOME_TABELA>`

```sql
CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
CONSTRAINT PK_TDCXYZFAT PRIMARY KEY (CODPARC, DTFAT)
```

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

---

## Tipos de Dados

### Mapeamento por Banco

| Tipo lógico | Oracle         | SQL Server      | Uso                                       |
|:------------|:---------------|:----------------|:------------------------------------------|
| Inteiro     | `NUMBER(10)`   | `INT`           | `COD*`/`NU*` sequenciais, contadores, FKs |
| Decimal     | `NUMBER(18,N)` | `DECIMAL(18,N)` | Valores monetários, percentuais           |
| Texto       | `VARCHAR2(n)`  | `VARCHAR(n)`    | Texto tamanho variável                    |
| Flag S/N    | `CHAR(1)`      | `CHAR(1)`       | Flags booleanas                           |
| Data/Hora   | `DATE`         | `DATETIME`      | Data e/ou data+hora                       |

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

### CREATE TABLE (somente PK + constraint)

Script criação contém **exclusivamente** colunas PK + constraint PK.

#### PK Simples

```xml

<sql nomeTabela="TDCXYZCAD" ordem="1" executar="SE_NAO_EXISTIR"
     tipoObjeto="TABLE" nomeObjeto="TDCXYZCAD"
     descricao="Criacao da tabela TDCXYZCAD">
    <mssql>
        CREATE TABLE TDCXYZCAD (
        CODCAD INT NOT NULL,
        CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
        )
    </mssql>
    <oracle>
        CREATE TABLE TDCXYZCAD (
        CODCAD NUMBER(10) NOT NULL,
        CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
        )
    </oracle>
</sql>
```

#### PK Composta

```xml

<sql nomeTabela="TDCXYZFAT" ordem="1" executar="SE_NAO_EXISTIR"
     tipoObjeto="TABLE" nomeObjeto="TDCXYZFAT"
     descricao="Criacao da tabela TDCXYZFAT">
    <mssql>
        CREATE TABLE TDCXYZFAT (
        CODPARC INT NOT NULL,
        DTFAT DATETIME NOT NULL,
        CONSTRAINT PK_TDCXYZFAT PRIMARY KEY (CODPARC, DTFAT)
        )
    </mssql>
    <oracle>
        CREATE TABLE TDCXYZFAT (
        CODPARC NUMBER(10) NOT NULL,
        DTFAT DATE NOT NULL,
        CONSTRAINT PK_TDCXYZFAT PRIMARY KEY (CODPARC, DTFAT)
        )
    </oracle>
</sql>
```

### ALTER TABLE — Adicionar Coluna (uma por `<sql>`)

Após `CREATE TABLE`, cada coluna adicional criada via `ALTER TABLE ADD` com `executar="SE_NAO_EXISTIR"` e `tipoObjeto="COLUMN"`.

```xml

<sql nomeTabela="TDCXYZCAD" ordem="2" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="DESCR"
     descricao="Adicionar campo DESCR na tabela TDCXYZCAD">
    <mssql>
        ALTER TABLE TDCXYZCAD ADD DESCR VARCHAR(200)
    </mssql>
    <oracle>
        ALTER TABLE TDCXYZCAD ADD (DESCR VARCHAR2(200))
    </oracle>
</sql>

<sql nomeTabela="TDCXYZCAD" ordem="3" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="CODPARC"
     descricao="Adicionar campo CODPARC na tabela TDCXYZCAD">
<mssql>
    ALTER TABLE TDCXYZCAD ADD CODPARC INT
</mssql>
<oracle>
    ALTER TABLE TDCXYZCAD ADD (CODPARC NUMBER(10))
</oracle>
</sql>

<sql nomeTabela="TDCXYZCAD" ordem="4" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="VLRTOTAL"
     descricao="Adicionar campo VLRTOTAL na tabela TDCXYZCAD">
<mssql>
    ALTER TABLE TDCXYZCAD ADD VLRTOTAL DECIMAL(18,2)
</mssql>
<oracle>
    ALTER TABLE TDCXYZCAD ADD (VLRTOTAL NUMBER(18,2))
</oracle>
</sql>

<sql nomeTabela="TDCXYZCAD" ordem="5" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="ATIVO"
     descricao="Adicionar campo ATIVO na tabela TDCXYZCAD">
<mssql>
    ALTER TABLE TDCXYZCAD ADD ATIVO CHAR(1)
</mssql>
<oracle>
    ALTER TABLE TDCXYZCAD ADD (ATIVO CHAR(1))
</oracle>
</sql>

<sql nomeTabela="TDCXYZCAD" ordem="6" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="DHALTER"
     descricao="Adicionar campo DHALTER na tabela TDCXYZCAD">
<mssql>
    ALTER TABLE TDCXYZCAD ADD DHALTER DATETIME
</mssql>
<oracle>
    ALTER TABLE TDCXYZCAD ADD (DHALTER DATE)
</oracle>
</sql>
```

### ALTER TABLE — Modificar Coluna Existente

```xml

<sql nomeTabela="TDCXYZCAD" ordem="1" executar="SE_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="DESCR"
     descricao="Alterar tamanho do campo DESCR na tabela TDCXYZCAD">
    <mssql>
        ALTER TABLE TDCXYZCAD ALTER COLUMN DESCR VARCHAR(500)
    </mssql>
    <oracle>
        ALTER TABLE TDCXYZCAD MODIFY (DESCR VARCHAR2(500))
    </oracle>
</sql>
```

---

### Tabelas Nativas (`nativeTable`) — Somente ALTER TABLE

Tabelas nativas Sankhya (tag `<nativeTable>` no dicionário) **NÃO têm CREATE TABLE**. Script contém **apenas ALTER TABLE** para colunas **customizadas** do add-on.

#### Como identificar o que precisa de script

| Tipo de campo no dicionário                            | Script necessário?          | Motivo                         |
|:-------------------------------------------------------|:----------------------------|:-------------------------------|
| Campo nativo (ex: `CODPARC`, `NUNOTA`)                 | **Não**                   | Já existe tabela Sankhya       |
| Campo customizado (ex: `XYZ_STATUS`, `XYZ_CODRECEITA`) | **Sim** — ALTER TABLE ADD | Adicionado pelo add-on         |

> Convenção: prefixo addon + `_` (ex: `XYZ_`) em campos customizados para identificação fácil.

#### Exemplo

```xml
<!-- V003-ALTER_TABLE_TGFCAB.xml -->
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <sql nomeTabela="TGFCAB" ordem="1" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="XYZ_CODRECEITA"
         descricao="Adicionar campo XYZ_CODRECEITA na tabela TGFCAB">
        <mssql>
            ALTER TABLE TGFCAB ADD XYZ_CODRECEITA VARCHAR(100)
        </mssql>
        <oracle>
            ALTER TABLE TGFCAB ADD (XYZ_CODRECEITA VARCHAR2(100))
        </oracle>
    </sql>

    <sql nomeTabela="TGFCAB" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="XYZ_STATUS"
         descricao="Adicionar campo XYZ_STATUS na tabela TGFCAB">
        <mssql>
            ALTER TABLE TGFCAB ADD XYZ_STATUS VARCHAR(50)
        </mssql>
        <oracle>
            ALTER TABLE TGFCAB ADD (XYZ_STATUS VARCHAR2(50))
        </oracle>
    </sql>

</scripts>
```

---

### Relação Dicionário de Dados -> Scripts

| Tag no dicionário | CREATE TABLE?                    | ALTER TABLE para colunas?                           | Observação                |
|:------------------|:---------------------------------|:----------------------------------------------------|:--------------------------|
| `<table>`         | Sim (somente PKs + constraint) | Sim (cada coluna não-PK individualmente)          | Tabela criada pelo add-on |
| `<nativeTable>`   | Não                            | Somente colunas com prefixo do addon (ex: `XYZ_`) | Tabela nativa Sankhya     |

---

### INSERT — Dados de Configuração

```xml

<sql nomeTabela="TDCXYZCFG" ordem="1" executar="SEMPRE"
     tipoObjeto="TABLE" nomeObjeto="INSERT_CONFIG"
     descricao="Inserir registro padrao de configuracao">
    <mssql>
        INSERT INTO TDCXYZCFG (CODCFG)
        SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM TDCXYZCFG)
    </mssql>
    <oracle>
        INSERT INTO TDCXYZCFG (CODCFG)
        SELECT 1 FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM TDCXYZCFG)
    </oracle>
</sql>
```

> **Dica:** INSERTs com `executar="SEMPRE"`, usar `MERGE` ou `INSERT ... WHERE NOT EXISTS` para idempotência. Oracle usar `FROM DUAL`, SQL Server omitir.

---

## Mapeamento Dicionário de Dados -> Tipos de Banco (Referência)

| `dataType` no dicionário          | Oracle                  | SQL Server              | Observação                           |
|:----------------------------------|:------------------------|:------------------------|:-------------------------------------|
| `INTEIRO`                         | `NUMBER(10)`            | `INT`                   |                                      |
| `TEXTO` (com `size`)              | `VARCHAR2(<size>)`      | `VARCHAR(<size>)`       |                                      |
| `DECIMAL` (com `nuCasasDecimais`) | `NUMBER(18,<N>)`        | `DECIMAL(18,<N>)`       |                                      |
| `DATA_HORA` ou `DATA`             | `DATE`                  | `DATETIME`              |                                      |
| `CHECKBOX`                        | `CHAR(1)`               | `CHAR(1)`               |                                      |
| `PESQUISA`                        | Depende do `targetType` | Depende do `targetType` | Ex: `INTEIRO` -> `NUMBER(10)` / `INT` |

### Mapeamento Banco -> Tipo do Dicionário (inverso)

| Oracle         | SQL Server                  | Tipo Dicionário          | Condição                   |
|:---------------|:----------------------------|:---------------------------|:---------------------------|
| `NUMBER(10)`   | `INT`                       | `INTEIRO`                  | Sem FK                     |
| `NUMBER(10)`   | `INT`                       | `PESQUISA`                 | Com relacionamento (FK)    |
| `NUMBER(18,N)` | `DECIMAL(18,N)`             | `DECIMAL`                  | Com casas decimais         |
| `VARCHAR2(n)`  | `VARCHAR(n)`                | `TEXTO` size=n             | Texto livre                |
| `VARCHAR2(n)`  | `VARCHAR(n)` + opções fixas | `TEXTO` + `<fieldOptions>` | Enum valores definidos     |
| `CHAR(1)`      | `CHAR(1)` S/N               | `CHECKBOX`                 | Flag booleana              |
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
    ATIVO CHAR(1),
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

### 11. Versionamento fora do padrão

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

---

## Exemplos Completos

### V001-CREATE_TABLE_TDCXYZCAD.xml | Tabela nova com PK simples

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <!-- 1. CREATE TABLE somente com PK e constraint -->
    <sql nomeTabela="TDCXYZCAD" ordem="1" executar="SE_NAO_EXISTIR"
         tipoObjeto="TABLE" nomeObjeto="TDCXYZCAD"
         descricao="Criacao da tabela TDCXYZCAD">
        <mssql>
            CREATE TABLE TDCXYZCAD (
            CODCAD INT NOT NULL,
            CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
            )
        </mssql>
        <oracle>
            CREATE TABLE TDCXYZCAD (
            CODCAD NUMBER(10) NOT NULL,
            CONSTRAINT PK_TDCXYZCAD PRIMARY KEY (CODCAD)
            )
        </oracle>
    </sql>

    <!-- 2. ALTER TABLE para cada coluna não-PK -->
    <sql nomeTabela="TDCXYZCAD" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DESCR"
         descricao="Adicionar campo DESCR na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD DESCR VARCHAR(200)
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (DESCR VARCHAR2(200))
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="3" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="CODPARC"
         descricao="Adicionar campo CODPARC na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD CODPARC INT
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (CODPARC NUMBER(10))
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="4" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="VLRTOTAL"
         descricao="Adicionar campo VLRTOTAL na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD VLRTOTAL DECIMAL(18,2)
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (VLRTOTAL NUMBER(18,2))
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="5" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="ATIVO"
         descricao="Adicionar campo ATIVO na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD ATIVO CHAR(1)
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (ATIVO CHAR(1))
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="6" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="CODUSU"
         descricao="Adicionar campo CODUSU na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD CODUSU INT
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (CODUSU NUMBER(10))
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="7" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DHALTER"
         descricao="Adicionar campo DHALTER na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD DHALTER DATETIME
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (DHALTER DATE)
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="8" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DHCREATE"
         descricao="Adicionar campo DHCREATE na tabela TDCXYZCAD">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD DHCREATE DATETIME
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD (DHCREATE DATE)
        </oracle>
    </sql>

</scripts>
```

### V002-CREATE_TABLE_TDCXYZFAT.xml — Tabela com PK composta

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <!-- 1. CREATE TABLE com PK composta -->
    <sql nomeTabela="TDCXYZFAT" ordem="1" executar="SE_NAO_EXISTIR"
         tipoObjeto="TABLE" nomeObjeto="TDCXYZFAT"
         descricao="Criacao da tabela TDCXYZFAT">
        <mssql>
            CREATE TABLE TDCXYZFAT (
            CODPARC INT NOT NULL,
            DTFAT DATETIME NOT NULL,
            CONSTRAINT PK_TDCXYZFAT PRIMARY KEY (CODPARC, DTFAT)
            )
        </mssql>
        <oracle>
            CREATE TABLE TDCXYZFAT (
            CODPARC NUMBER(10) NOT NULL,
            DTFAT DATE NOT NULL,
            CONSTRAINT PK_TDCXYZFAT PRIMARY KEY (CODPARC, DTFAT)
            )
        </oracle>
    </sql>

    <!-- 2. ALTER TABLE para colunas não-PK -->
    <sql nomeTabela="TDCXYZFAT" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="VLRTOTAL"
         descricao="Adicionar campo VLRTOTAL na tabela TDCXYZFAT">
        <mssql>
            ALTER TABLE TDCXYZFAT ADD VLRTOTAL DECIMAL(18,2)
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZFAT ADD (VLRTOTAL NUMBER(18,2))
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZFAT" ordem="3" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="ATIVO"
         descricao="Adicionar campo ATIVO na tabela TDCXYZFAT">
        <mssql>
            ALTER TABLE TDCXYZFAT ADD ATIVO CHAR(1)
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZFAT ADD (ATIVO CHAR(1))
        </oracle>
    </sql>

</scripts>
```

### V003-ALTER_TABLE_TGFCAB.xml — Tabela nativa (somente colunas customizadas)

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <sql nomeTabela="TGFCAB" ordem="1" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="XYZ_CODRECEITA"
         descricao="Adicionar campo XYZ_CODRECEITA na tabela TGFCAB">
        <mssql>
            ALTER TABLE TGFCAB ADD XYZ_CODRECEITA VARCHAR(100)
        </mssql>
        <oracle>
            ALTER TABLE TGFCAB ADD (XYZ_CODRECEITA VARCHAR2(100))
        </oracle>
    </sql>

    <sql nomeTabela="TGFCAB" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="XYZ_STATUS"
         descricao="Adicionar campo XYZ_STATUS na tabela TGFCAB">
        <mssql>
            ALTER TABLE TGFCAB ADD XYZ_STATUS VARCHAR(50)
        </mssql>
        <oracle>
            ALTER TABLE TGFCAB ADD (XYZ_STATUS VARCHAR2(50))
        </oracle>
    </sql>

</scripts>
```

### v_insert_config.xml — Dados de configuração

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <sql nomeTabela="TDCXYZCFG" ordem="1" executar="SEMPRE"
         tipoObjeto="TABLE" nomeObjeto="INSERT_CONFIG"
         descricao="Insere um registro padrao de configuracao">
        <mssql>
            INSERT INTO TDCXYZCFG (CODCFG)
            SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM TDCXYZCFG)
        </mssql>
        <oracle>
            INSERT INTO TDCXYZCFG (CODCFG)
            SELECT 1 FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM TDCXYZCFG)
        </oracle>
    </sql>

</scripts>
```

---

## Checklists

### Tabela nova (`<table>` no dicionário)

- [ ] Verificar último `V<NNN>-*.xml` existente para definir `N+1` (3 dígitos, zero-padded)
- [ ] Nomear arquivo `V<NNN>-CREATE_TABLE_<TABELA>.xml`
- [ ] Confirmar nome tabela com usuário
- [ ] CREATE TABLE com **só** colunas PK + `CONSTRAINT PK_<TABELA>`
- [ ] Incluir **ambas** tags `<mssql>` e `<oracle>` em cada `<sql>`
- [ ] ALTER TABLE ADD para **cada** coluna não-PK (um `<sql>` por coluna)
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

### Dados de configuração

- [ ] Nomear arquivo descritivamente (ex: `v_insert_config.xml`)
- [ ] Usar `executar="SEMPRE"` com `INSERT ... WHERE NOT EXISTS` ou `MERGE` para idempotência


## Related Skills

- `entity` — entidade @JapeEntity da tabela criada por este dbscript
- `data-dictionary` — XML que descreve metadados da tabela
- `macros` — macros SQL para portabilidade Oracle/MSSQL no dbscript
