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

