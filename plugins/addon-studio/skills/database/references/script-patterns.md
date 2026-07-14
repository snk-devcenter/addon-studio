# Padrões de Script por Operação — Database (Sankhya Addon Studio)

## CREATE TABLE (somente PK + constraint)

Script criação contém **exclusivamente** colunas PK + constraint PK.

### PK Simples

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

### PK Composta

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

## ALTER TABLE — Adicionar Coluna (uma por `<sql>`)

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
    ALTER TABLE TDCXYZCAD ADD (ATIVO VARCHAR2(1))
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

## ALTER TABLE — Modificar Coluna Existente

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

## CHECK Constraints — Campos `LISTA` e `CHECKBOX`

Todo campo do dicionário com **domínio fechado** ganha uma CHECK constraint no banco, num `<sql>` próprio **depois** do `ALTER TABLE ADD` da coluna:

| Campo no dicionário               | Valores permitidos                    |
|:----------------------------------|:--------------------------------------|
| `dataType="LISTA"` + `<fieldOptions>` | Cada `value` das `<option>`       |
| `dataType="CHECKBOX"`             | `'S'`, `'N'` (fixo)                   |

### Onde a CHECK entra — criação vs. modificação

Duas granularidades diferentes, **não confundir**:

| Situação                                                    | Onde vai                                                     | `executar`       |
|:------------------------------------------------------------|:-------------------------------------------------------------|:-----------------|
| **Criar** CHECK junto com a coluna (tabela/coluna nova)     | `<sql>` próprio no **mesmo arquivo** `V<NNN>`, `ordem` seguinte à da coluna | `SE_NAO_EXISTIR` |
| **Modificar** CHECK existente (script já deployado)         | **Novo arquivo** `V<NNN+1>` — DROP + recreate                | `SE_EXISTIR` no DROP, `SE_NAO_EXISTIR` no ADD |

> Vale a regra de migração nº 9: script aplicado é **imutável**. Editar o `V<NNN>` original para trocar as opções não reexecuta nada em quem já deployou — o ambiente fica com a CHECK antiga e o dicionário novo, divergentes em silêncio. Sempre `V<NNN+1>`.
>
> **Nunca** dentro do `ALTER TABLE ADD` da coluna, nos dois casos — ver anti-pattern nº 12 em [`../SKILL.md`](../SKILL.md).

**Nome da constraint:** `CK_<TABELA>_<COLUNA>`

**Atributos do `<sql>`:** `executar="SE_NAO_EXISTIR"`, `tipoObjeto="CONSTRAINT"`, `nomeObjeto="CK_<TABELA>_<COLUNA>"`.

> Sintaxe `ADD CONSTRAINT ... CHECK` é idêntica em Oracle e MSSQL — mas as duas tags continuam obrigatórias (regra do projeto).
>
> **Limite de 30 caracteres no Oracle** (até 12.1): `CK_TDCXYZCAD_DESCRSITUACAO` = 26 OK; nomes maiores estouram. Encurtar o sufixo da coluna e **confirmar com o dev** — nunca truncar em silêncio.

### `LISTA` (opções do `<fieldOptions>`)

Dicionário:

```xml
<field name="TIPO" dataType="LISTA" size="1" ...>
    <description>Tipo</description>
    <fieldOptions>
        <option value="A">Opcao A</option>
        <option value="B">Opcao B</option>
    </fieldOptions>
</field>
```

Script:

```xml
<sql nomeTabela="TDCXYZCAD" ordem="7" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="TIPO"
     descricao="Adicionar campo TIPO na tabela TDCXYZCAD">
    <mssql>
        ALTER TABLE TDCXYZCAD ADD TIPO VARCHAR(1)
    </mssql>
    <oracle>
        ALTER TABLE TDCXYZCAD ADD (TIPO VARCHAR2(1))
    </oracle>
</sql>

<sql nomeTabela="TDCXYZCAD" ordem="8" executar="SE_NAO_EXISTIR"
     tipoObjeto="CONSTRAINT" nomeObjeto="CK_TDCXYZCAD_TIPO"
     descricao="Restringir valores do campo TIPO aos definidos no dicionario">
<mssql>
    ALTER TABLE TDCXYZCAD ADD CONSTRAINT CK_TDCXYZCAD_TIPO CHECK (TIPO IN ('A', 'B'))
</mssql>
<oracle>
    ALTER TABLE TDCXYZCAD ADD CONSTRAINT CK_TDCXYZCAD_TIPO CHECK (TIPO IN ('A', 'B'))
</oracle>
</sql>
```

### `CHECKBOX` (sempre `'S'` / `'N'`)

```xml
<sql nomeTabela="TDCXYZCAD" ordem="5" executar="SE_NAO_EXISTIR"
     tipoObjeto="COLUMN" nomeObjeto="ATIVO"
     descricao="Adicionar campo ATIVO na tabela TDCXYZCAD">
    <mssql>
        ALTER TABLE TDCXYZCAD ADD ATIVO CHAR(1)
    </mssql>
    <oracle>
        ALTER TABLE TDCXYZCAD ADD (ATIVO VARCHAR2(1))
    </oracle>
</sql>

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

> **Coluna que aceita nulo:** `CHECK (COL IN (...))` **não** barra `NULL` (`NULL IN (...)` = desconhecido, não violação). Obrigatoriedade é do `NOT NULL` / `nullable="N"`, não da CHECK. Não adicionar `OR COL IS NULL`.

### Constraint em tabela nativa

Vale a mesma regra — mas **só** para colunas do addon (prefixo `<MOD>_`). Nunca criar CHECK em coluna nativa Sankhya.

```xml
<sql nomeTabela="TGFCAB" ordem="3" executar="SE_NAO_EXISTIR"
     tipoObjeto="CONSTRAINT" nomeObjeto="CK_TGFCAB_XYZ_STATUS"
     descricao="Restringir valores do campo XYZ_STATUS">
    <mssql>
        ALTER TABLE TGFCAB ADD CONSTRAINT CK_TGFCAB_XYZ_STATUS CHECK (XYZ_STATUS IN ('PENDENTE', 'PROCESSADO'))
    </mssql>
    <oracle>
        ALTER TABLE TGFCAB ADD CONSTRAINT CK_TGFCAB_XYZ_STATUS CHECK (XYZ_STATUS IN ('PENDENTE', 'PROCESSADO'))
    </oracle>
</sql>
```

### Evolução — mudar as opções de um campo existente

Não existe `ALTER CONSTRAINT` em Oracle nem MSSQL: mudar o domínio = **DROP + recreate**, nessa ordem, `<sql>` separados — e em **arquivo `V<NNN+1>` novo**, nunca editando o script que já criou a CHECK (regra de migração nº 9).

Adicionar `<option value="C">Opcao C</option>` ao dicionário do campo `TIPO`:

```xml
<!-- V006-ALTER_CONSTRAINT_TDCXYZCAD.xml -->
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <sql nomeTabela="TDCXYZCAD" ordem="1" executar="SE_EXISTIR"
         tipoObjeto="CONSTRAINT" nomeObjeto="CK_TDCXYZCAD_TIPO"
         descricao="Remover CHECK antiga do campo TIPO">
        <mssql>
            ALTER TABLE TDCXYZCAD DROP CONSTRAINT CK_TDCXYZCAD_TIPO
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD DROP CONSTRAINT CK_TDCXYZCAD_TIPO
        </oracle>
    </sql>

    <sql nomeTabela="TDCXYZCAD" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="CONSTRAINT" nomeObjeto="CK_TDCXYZCAD_TIPO"
         descricao="Recriar CHECK do campo TIPO incluindo a opcao C">
        <mssql>
            ALTER TABLE TDCXYZCAD ADD CONSTRAINT CK_TDCXYZCAD_TIPO CHECK (TIPO IN ('A', 'B', 'C'))
        </mssql>
        <oracle>
            ALTER TABLE TDCXYZCAD ADD CONSTRAINT CK_TDCXYZCAD_TIPO CHECK (TIPO IN ('A', 'B', 'C'))
        </oracle>
    </sql>

</scripts>
```

> **DROP com `SE_EXISTIR`, ADD com `SE_NAO_EXISTIR`** — nessa combinação o par é idempotente e não quebra em ambiente que nunca teve a CHECK antiga.

**Opção removida do domínio** (ex.: `'B'` sai da lista): dado já gravado com o valor antigo faz o `ADD CONSTRAINT` falhar e **quebra o deploy inteiro** no cliente. Migrar antes, em `ordem` intermediária:

```xml
<sql nomeTabela="TDCXYZCAD" ordem="2" executar="SEMPRE"
     tipoObjeto="TABLE" nomeObjeto="MIGRA_TIPO_B"
     descricao="Migrar registros com TIPO=B para A antes de recriar a CHECK">
    <mssql>
        UPDATE TDCXYZCAD SET TIPO = 'A' WHERE TIPO = 'B'
    </mssql>
    <oracle>
        UPDATE TDCXYZCAD SET TIPO = 'A' WHERE TIPO = 'B'
    </oracle>
</sql>
```

> Definir o destino do dado órfão é **decisão de negócio** — perguntar ao dev, nunca escolher sozinho. `ADD CONSTRAINT` passa a ser `ordem="3"`.

---

## Tabelas Nativas (`nativeTable`) — Somente ALTER TABLE

Tabelas nativas Sankhya (tag `<nativeTable>` no dicionário) **NÃO têm CREATE TABLE**. Script contém **apenas ALTER TABLE** para colunas **customizadas** do add-on.

### Como identificar o que precisa de script

| Tipo de campo no dicionário                            | Script necessário?          | Motivo                         |
|:-------------------------------------------------------|:----------------------------|:-------------------------------|
| Campo nativo (ex: `CODPARC`, `NUNOTA`)                 | **Não**                   | Já existe tabela Sankhya       |
| Campo customizado (ex: `XYZ_STATUS`, `XYZ_CODRECEITA`) | **Sim** — ALTER TABLE ADD | Adicionado pelo add-on         |

> Convenção: prefixo addon + `_` (ex: `XYZ_`) em campos customizados para identificação fácil.

### Exemplo

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

## Relação Dicionário de Dados -> Scripts

| Tag no dicionário | CREATE TABLE?                    | ALTER TABLE para colunas?                           | Observação                |
|:------------------|:---------------------------------|:----------------------------------------------------|:--------------------------|
| `<table>`         | Sim (somente PKs + constraint) | Sim (cada coluna não-PK individualmente)          | Tabela criada pelo add-on |
| `<nativeTable>`   | Não                            | Somente colunas com prefixo do addon (ex: `XYZ_`) | Tabela nativa Sankhya     |

---

## INSERT — Dados de Configuração

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

