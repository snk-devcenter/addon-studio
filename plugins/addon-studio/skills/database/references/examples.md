# Exemplos Completos — Database (Sankhya Addon Studio)

## V001-CREATE_TABLE_PRXXYZCAD.xml | Tabela nova com PK simples

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <!-- 1. CREATE TABLE somente com PK e constraint -->
    <sql nomeTabela="PRXXYZCAD" ordem="1" executar="SE_NAO_EXISTIR"
         tipoObjeto="TABLE" nomeObjeto="PRXXYZCAD"
         descricao="Criacao da tabela PRXXYZCAD">
        <mssql>
            CREATE TABLE PRXXYZCAD (
            CODCAD INT NOT NULL,
            CONSTRAINT PK_PRXXYZCAD PRIMARY KEY (CODCAD)
            )
        </mssql>
        <oracle>
            CREATE TABLE PRXXYZCAD (
            CODCAD NUMBER(10) NOT NULL,
            CONSTRAINT PK_PRXXYZCAD PRIMARY KEY (CODCAD)
            )
        </oracle>
    </sql>

    <!-- 2. ALTER TABLE para cada coluna não-PK -->
    <sql nomeTabela="PRXXYZCAD" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DESCR"
         descricao="Adicionar campo DESCR na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD DESCR VARCHAR(200)
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (DESCR VARCHAR2(200))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="3" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="CODPARC"
         descricao="Adicionar campo CODPARC na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD CODPARC INT
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (CODPARC NUMBER(10))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="4" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="VLRTOTAL"
         descricao="Adicionar campo VLRTOTAL na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD VLRTOTAL FLOAT(53)
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (VLRTOTAL FLOAT(126))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="5" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="ATIVO"
         descricao="Adicionar campo ATIVO na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD ATIVO CHAR(1)
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (ATIVO VARCHAR2(1))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="6" executar="SE_NAO_EXISTIR"
         tipoObjeto="CONSTRAINT" nomeObjeto="CK_PRXXYZCAD_ATIVO"
         descricao="Restringir o campo ATIVO aos valores S e N">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD CONSTRAINT CK_PRXXYZCAD_ATIVO CHECK (ATIVO IN ('S', 'N'))
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD CONSTRAINT CK_PRXXYZCAD_ATIVO CHECK (ATIVO IN ('S', 'N'))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="7" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="CODUSU"
         descricao="Adicionar campo CODUSU na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD CODUSU INT
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (CODUSU NUMBER(10))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="8" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DHALTER"
         descricao="Adicionar campo DHALTER na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD DHALTER DATETIME
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (DHALTER DATE)
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZCAD" ordem="9" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DHCREATE"
         descricao="Adicionar campo DHCREATE na tabela PRXXYZCAD">
        <mssql>
            ALTER TABLE PRXXYZCAD ADD DHCREATE DATETIME
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZCAD ADD (DHCREATE DATE)
        </oracle>
    </sql>

</scripts>
```

## V002-CREATE_TABLE_PRXXYZFAT.xml — Tabela com PK composta

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <!-- 1. CREATE TABLE com PK composta -->
    <sql nomeTabela="PRXXYZFAT" ordem="1" executar="SE_NAO_EXISTIR"
         tipoObjeto="TABLE" nomeObjeto="PRXXYZFAT"
         descricao="Criacao da tabela PRXXYZFAT">
        <mssql>
            CREATE TABLE PRXXYZFAT (
            CODPARC INT NOT NULL,
            DTFAT DATETIME NOT NULL,
            CONSTRAINT PK_PRXXYZFAT PRIMARY KEY (CODPARC, DTFAT)
            )
        </mssql>
        <oracle>
            CREATE TABLE PRXXYZFAT (
            CODPARC NUMBER(10) NOT NULL,
            DTFAT DATE NOT NULL,
            CONSTRAINT PK_PRXXYZFAT PRIMARY KEY (CODPARC, DTFAT)
            )
        </oracle>
    </sql>

    <!-- 2. ALTER TABLE para colunas não-PK -->
    <sql nomeTabela="PRXXYZFAT" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="VLRTOTAL"
         descricao="Adicionar campo VLRTOTAL na tabela PRXXYZFAT">
        <mssql>
            ALTER TABLE PRXXYZFAT ADD VLRTOTAL FLOAT(53)
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZFAT ADD (VLRTOTAL FLOAT(126))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZFAT" ordem="3" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="ATIVO"
         descricao="Adicionar campo ATIVO na tabela PRXXYZFAT">
        <mssql>
            ALTER TABLE PRXXYZFAT ADD ATIVO CHAR(1)
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZFAT ADD (ATIVO VARCHAR2(1))
        </oracle>
    </sql>

    <sql nomeTabela="PRXXYZFAT" ordem="4" executar="SE_NAO_EXISTIR"
         tipoObjeto="CONSTRAINT" nomeObjeto="CK_PRXXYZFAT_ATIVO"
         descricao="Restringir o campo ATIVO aos valores S e N">
        <mssql>
            ALTER TABLE PRXXYZFAT ADD CONSTRAINT CK_PRXXYZFAT_ATIVO CHECK (ATIVO IN ('S', 'N'))
        </mssql>
        <oracle>
            ALTER TABLE PRXXYZFAT ADD CONSTRAINT CK_PRXXYZFAT_ATIVO CHECK (ATIVO IN ('S', 'N'))
        </oracle>
    </sql>

</scripts>
```

## V003-ALTER_TABLE_TGFCAB.xml — Tabela nativa (somente colunas customizadas)

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

## V005-INSERT_DATA_PRXXYZCTL.xml — Dados iniciais

PK derivada de `MAX+1` (o dicionário é dono da sequência) e idempotência pela **chave de negócio** (`ROTINA`), não pela PK:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

    <sql nomeTabela="PRXXYZCTL" ordem="1" executar="SEMPRE"
         tipoObjeto="TABLE" nomeObjeto="INSERT_ROTINA_X"
         descricao="Registra a rotina X no controle">
        <mssql>
            INSERT INTO PRXXYZCTL (CODCTL, ROTINA)
            SELECT COALESCE(MAX(CODCTL), 0) + 1, 'ROTINA_X'
            FROM PRXXYZCTL
            WHERE NOT EXISTS (SELECT 1 FROM PRXXYZCTL WHERE ROTINA = 'ROTINA_X')
        </mssql>
        <oracle>
            INSERT INTO PRXXYZCTL (CODCTL, ROTINA)
            SELECT NVL(MAX(CODCTL), 0) + 1, 'ROTINA_X'
            FROM PRXXYZCTL
            WHERE NOT EXISTS (SELECT 1 FROM PRXXYZCTL WHERE ROTINA = 'ROTINA_X')
        </oracle>
    </sql>

</scripts>
```

> Seed com PK literal (`SELECT 1`) disputa a próxima chave da sequência do framework. Registro único de configuração: não semear — deixar nascer pela tela/aplicação.

