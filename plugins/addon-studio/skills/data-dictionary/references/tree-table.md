# Tabela Hierárquica (`<treeTable>`) — Data Dictionary

Tipo especializado de tabela para cadastros com estrutura de árvore (pai/filho). O framework gera automaticamente UI com navegação expansível por níveis hierárquicos.

## Quando usar

Casos típicos:

- **Centros de custo** (estrutura contábil em níveis)
- **Categorias de produtos** (taxonomia hierárquica)
- **Organogramas** (departamentos pai/filho)
- **Plano de contas**, classificações multinível

> **Quando NÃO usar:** se os dados são planos (sem relação pai/filho), use `<table>` regular. `<treeTable>` para dados não hierárquicos complica modelo e UI desnecessariamente.

## Estrutura XML

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<metadados>
    <treeTable name="TDCXYZCCU" defaultMask="##.##.##">
        <description>Centro de Custo</description>

        <primaryKey>
            <field name="CODCCU"/>
        </primaryKey>

        <instances>
            <instance name="TdcXyzCentroCusto">
                <description>Centro de Custo</description>
            </instance>
        </instances>

        <fields>
            <field name="CODCCU" dataType="INTEIRO" required="S"/>
            <field name="DESCRCCU" dataType="TEXTO" size="100" required="S"/>
            <field name="ATIVO" dataType="CHECKBOX" required="S"/>
        </fields>
    </treeTable>
</metadados>
```

Filhos (`xs:all`, mesmo de `<table>`): `<description>`, `<primaryKey>`, `<instances>`, `<fields>`, `<filters>`.

## Atributos do `<treeTable>`

| Atributo | Obrigatório | Descrição | Exemplo |
|----------|:-----------:|-----------|---------|
| `name` | Sim | Nome da tabela no banco (segue convenção `<PRX><MOD3><CTX>`) | `TDCXYZCCU` |
| `defaultMask` | Sim* | Máscara de formatação dos códigos hierárquicos. Pattern: `((#){0,4}(\.)?){0,6}`, max 15 chars | `##.##.##` |
| `maskName` | Sim* | Referência a máscara pré-definida no sistema. 3-15 chars, `[a-zA-Z0-9_]+` | `CENTROCUSTO_MASK` |

\* Schema exige ao menos um (`defaultMask` ou `maskName`). Conferir convenção do projeto antes de escolher.

## Campos auto-gerados

Com **Auto DDL ativo**, o framework cria automaticamente 3 campos de controle. **Não declarar no XML.**

| Campo | Função | Tipo (DDL) |
|-------|--------|-----------|
| `CODIGOPAI` | FK para registro pai (raiz = `NULL`) | `NUMBER(10)` Oracle / `INT` MSSQL |
| `ANALITICO` | `'S'` aceita lançamentos; `'N'` agrupador (não aceita) | `CHAR(1)` |
| `GRAU` | Nível na hierarquia (0 = raiz, 1 = filhos, etc.) | `NUMBER(10)` Oracle / `INT` MSSQL |

## Sem Auto DDL — declarar manualmente no dbscript

Se o projeto não usa Auto DDL, o `CREATE TABLE` precisa incluir os 3 campos:

```xml
<sql nomeTabela="TDCXYZCCU" ordem="1" executar="SE_NAO_EXISTIR"
     tipoObjeto="TABLE" nomeObjeto="TDCXYZCCU"
     descricao="Criacao da tabela hierarquica TDCXYZCCU">
    <mssql>
        CREATE TABLE TDCXYZCCU (
        CODCCU INT NOT NULL,
        CODIGOPAI INT,
        ANALITICO CHAR(1) DEFAULT 'S' NOT NULL,
        GRAU INT NOT NULL,
        CONSTRAINT PK_TDCXYZCCU PRIMARY KEY (CODCCU)
        )
    </mssql>
    <oracle>
        CREATE TABLE TDCXYZCCU (
        CODCCU NUMBER(10) NOT NULL,
        CODIGOPAI NUMBER(10),
        ANALITICO CHAR(1) DEFAULT 'S' NOT NULL,
        GRAU NUMBER(10) NOT NULL,
        CONSTRAINT PK_TDCXYZCCU PRIMARY KEY (CODCCU)
        )
    </oracle>
</sql>
```

> **Erro mais comum:** omitir `CODIGOPAI`/`ANALITICO`/`GRAU` em dbscript manual. Causa erros em runtime (UI hierárquica falha ao tentar acessar campos inexistentes).

## Diferença `<treeTable>` vs `<table>`

| Aspecto | `<treeTable>` | `<table>` |
|---------|--------------|-----------|
| Estrutura | Hierárquica, pai/filho | Plana, tabular |
| Navegação | Tree-view expansível | Grid sequencial |
| Campos auto (Auto DDL) | `CODIGOPAI`, `ANALITICO`, `GRAU` | Nenhum |
| UI | Niveis recolhíveis | Listagem padrão |
| Uso típico | Cadastros com agrupamento | Movimentos, configs, fatos |

## Anti-patterns

- [ ] Declarar `<field name="CODIGOPAI">`, `<field name="ANALITICO">` ou `<field name="GRAU">` no XML quando Auto DDL está ativo — framework gera automaticamente, declarar duplica
- [ ] Omitir `CODIGOPAI`/`ANALITICO`/`GRAU` em `CREATE TABLE` manual sem Auto DDL — causa erro em runtime
- [ ] Usar `<treeTable>` para dados sem relação pai/filho — complica modelo desnecessariamente, prefira `<table>`
- [ ] Esquecer `defaultMask` ou `maskName` — schema exige pelo menos um
- [ ] Definir `defaultMask` fora do pattern `((#){0,4}(\.)?){0,6}` ou `maskName` fora de `[a-zA-Z0-9_]+` 3-15 chars

## Boas práticas

- Sempre definir `defaultMask` (ex.: `##.##.##` para 3 níveis de 2 dígitos cada) para consistência visual dos códigos
- Preferir Auto DDL em `treeTable` — elimina gerência manual de `CODIGOPAI`/`ANALITICO`/`GRAU`
- Nome da tabela segue convenção `<PRX><MOD3><CTX>` igual a `<table>` regular
- Instance name em PascalCase (`TdcXyzCentroCusto`) para mapear `@JapeEntity(entity = "...")`
