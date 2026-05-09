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

## Campos de controle hierárquico (obrigatórios)

Toda `<treeTable>` exige 3 campos de controle que o framework usa para navegação tree, validação de níveis e exibição da UI hierárquica. **No projeto Sankhya Addon Studio, esses campos são declarados manualmente em todos os artefatos** (dbscript + entity Java) — não há Auto DDL.

| Campo | Função | Tipo (DDL) | Tipo Java |
|-------|--------|-----------|-----------|
| `CODIGOPAI` | FK para registro pai (raiz = `NULL`) | `NUMBER(10)` Oracle / `INT` MSSQL | `Integer` |
| `ANALITICO` | `'S'` aceita lançamentos; `'N'` é agrupador (apenas estrutura) | `CHAR(1)` (default `'S'`, NOT NULL) | `Boolean` (CHECKBOX `'S'`/`'N'`) |
| `GRAU` | Nível na hierarquia (0 = raiz, 1 = filhos, etc.) | `NUMBER(10)` Oracle / `INT` MSSQL (NOT NULL) | `Integer` |

## Padrão dbscript (manual, dual MSSQL/Oracle)

`CREATE TABLE` da `<treeTable>` **sempre** inclui os 3 campos de controle + PK + colunas próprias:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<scripts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="../.gradle/scripts.xsd">

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

    <!-- ALTER TABLE para colunas próprias (uma por <sql>, na ordem do projeto) -->
    <sql nomeTabela="TDCXYZCCU" ordem="2" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="DESCRCCU"
         descricao="Adicionar campo DESCRCCU em TDCXYZCCU">
        <mssql>ALTER TABLE TDCXYZCCU ADD DESCRCCU VARCHAR(100) NOT NULL</mssql>
        <oracle>ALTER TABLE TDCXYZCCU ADD (DESCRCCU VARCHAR2(100) NOT NULL)</oracle>
    </sql>

    <sql nomeTabela="TDCXYZCCU" ordem="3" executar="SE_NAO_EXISTIR"
         tipoObjeto="COLUMN" nomeObjeto="ATIVO"
         descricao="Adicionar campo ATIVO em TDCXYZCCU">
        <mssql>ALTER TABLE TDCXYZCCU ADD ATIVO CHAR(1) DEFAULT 'S' NOT NULL</mssql>
        <oracle>ALTER TABLE TDCXYZCCU ADD (ATIVO CHAR(1) DEFAULT 'S' NOT NULL)</oracle>
    </sql>

</scripts>
```

**Regras críticas:**

- `CODIGOPAI` é nullable (raiz não tem pai) — **não** marcar `NOT NULL`
- `ANALITICO` tem `DEFAULT 'S'` (registros novos aceitam lançamentos por padrão) e é `NOT NULL`
- `GRAU` é `NOT NULL` (raiz sempre tem grau 0)
- Os 3 campos vão direto no `CREATE TABLE` (ao contrário do padrão "CREATE TABLE mínimo" usado em `<table>` regular, onde só PK fica no CREATE)
- Demais colunas seguem padrão usual: `ALTER TABLE ADD` por coluna, uma por `<sql>`

## Padrão entidade `@JapeEntity` Java

Entidade Java declara os 3 campos de controle como `@Column` normais — framework lê/escreve via JapeRepository igual a qualquer outro campo:

```java
import br.com.sankhya.studio.persistence.JapeEntity;
import br.com.sankhya.studio.persistence.Id;
import br.com.sankhya.studio.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(entity = "TdcXyzCentroCusto", table = "TDCXYZCCU")
public class TdcXyzCentroCusto {

    @Id
    @Column(name = "CODCCU")
    private Integer codCentroCusto;

    // ====== Campos de controle hierárquico (obrigatórios em <treeTable>) ======

    @Column(name = "CODIGOPAI")
    private Integer codigoPai;          // null para raiz

    @Column(name = "ANALITICO")
    private Boolean analitico;          // CHECKBOX 'S'/'N' — true = aceita lançamentos

    @Column(name = "GRAU")
    private Integer grau;               // 0 = raiz

    // ====== Campos próprios ======

    @Column(name = "DESCRCCU")
    private String descricao;

    @Column(name = "ATIVO")
    private Boolean ativo;
}
```

**Regras críticas:**

- `CODIGOPAI` é `Integer` (mesmo tipo da PK), nullable — sempre permite `null` para registros raiz
- `ANALITICO` é `Boolean` mapeado como CHECKBOX (framework converte `'S'`/`'N'` ↔ `true`/`false` automaticamente)
- `GRAU` é `Integer`, não-null
- Lombok `@Data` + `@NoArgsConstructor` + `@AllArgsConstructor` obrigatórios (regra geral de `@JapeEntity`)
- `@Column(name = "...")` apenas com `name` — sem outros atributos (regra universal do plugin)

## Diferença `<treeTable>` vs `<table>`

| Aspecto | `<treeTable>` | `<table>` |
|---------|--------------|-----------|
| Estrutura | Hierárquica, pai/filho | Plana, tabular |
| Navegação | Tree-view expansível | Grid sequencial |
| Campos de controle | `CODIGOPAI`, `ANALITICO`, `GRAU` (manuais no projeto) | Nenhum |
| `CREATE TABLE` | Inclui os 3 campos de controle + PK | Só PK + constraint |
| UI | Niveis recolhíveis | Listagem padrão |
| Uso típico | Cadastros com agrupamento | Movimentos, configs, fatos |

## Anti-patterns

- [ ] Omitir `CODIGOPAI`/`ANALITICO`/`GRAU` em `CREATE TABLE` — causa erro em runtime (UI hierárquica falha ao acessar campos inexistentes)
- [ ] `CODIGOPAI` declarado como `NOT NULL` — registros raiz não têm pai, precisam de `NULL`
- [ ] `ANALITICO` sem `DEFAULT 'S'` — força preenchimento explícito em todo INSERT
- [ ] `GRAU` como `NULL` — todo registro tem grau, mesmo a raiz (0)
- [ ] Usar `<treeTable>` para dados sem relação pai/filho — complica modelo desnecessariamente, prefira `<table>`
- [ ] Esquecer `defaultMask` ou `maskName` — schema exige pelo menos um
- [ ] Definir `defaultMask` fora do pattern `((#){0,4}(\.)?){0,6}` ou `maskName` fora de `[a-zA-Z0-9_]+` 3-15 chars
- [ ] Esquecer dos 3 campos de controle na entidade `@JapeEntity` — framework precisa deles para tree-view funcionar

## Boas práticas

- Sempre definir `defaultMask` (ex.: `##.##.##` para 3 níveis de 2 dígitos cada) para consistência visual dos códigos
- Nome da tabela segue convenção `<PRX><MOD3><CTX>` igual a `<table>` regular
- Instance name em PascalCase (`TdcXyzCentroCusto`) para mapear `@JapeEntity(entity = "...")`
- Bloco de auditoria (`DHALTER`, `DHCREATE`, `CODUSU`) em `treeTable` segue mesmas regras das tabelas regulares — perguntar ao dev se inclui
- Validar via teste manual após deploy: criar 2-3 registros com pai/filho, abrir UI, conferir que tree-view monta níveis corretamente
