# Exemplos Completos — Database (Sankhya Addon Studio)

## V001-CREATE_TABLE_TDCXYZCAD.xml | Tabela nova com PK simples

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

## V002-CREATE_TABLE_TDCXYZFAT.xml — Tabela com PK composta

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

## v_insert_config.xml — Dados de configuração

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

