# Exemplos Completos — Entity (Sankhya Addon Studio)

## Entidade com PK simples

```java

@Data
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(entity = "TdcXyzEntidade", table = "TDCXYZENT")
public class TdcXyzEntidade {

    @Id
    @Column(name = "CODENTIDADE")
    private Integer codEntidade;

    @Column(name = "DESCR")
    private String descricao;

    @Column(name = "OBSERVACAO")
    private String observacao;

    @Column(name = "CODIGO")
    private BigDecimal codigo;
}
```

## Entidade com PK composta + relacionamentos

```java

@Data
@NoArgsConstructor
@JapeEntity(entity = "TdcXyzRelacao", table = "TDCXYZREL")
public class TdcXyzRelacao {

    @Id
    private TdcXyzRelacaoId embeddedId;

    @Column(name = "NUREF")
    private BigDecimal nuRef;

    @Column(name = "QTDMIN")
    private BigDecimal qtdMinima;

    // Navegação OneToOne — FK aponta direto pra PK da entidade alvo
    @OneToOne
    @JoinColumn(name = "CODORIGEM", referencedColumnName = "CODPRODUTO")
    private TdcXyzProduto produtoOrigem;

    // Métodos auxiliares para PK composta
    public Integer getCodOrig() {
        return this.embeddedId.getCodOrig();
    }
}
```

> **`@ManyToOne` com FK pra campo não-PK:** caso menos comum (FK aponta pra coluna única não-PK da entidade alvo). Padrão e exemplo correto em `data-dictionary` → `xml-to-java.md` (seção "Atenção: FK que referencia campo nao-PK"). Não duplicar a mesma coluna local em múltiplos `@JoinColumn` na mesma entidade — cada `@JoinColumn` deve usar coluna FK local distinta.

## Entidade com @OneToMany (pai com filhos)

```java

@Data
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(entity = "TdcXyzProduto", table = "TDCXYZPRD")
public class TdcXyzProduto {

    @Id
    @Column(name = "CODPRODUTO")
    private Integer codProduto;

    @Column(name = "DESCRPRODUTO")
    private String nomeProduto;

    @OneToMany(
        cascade = Cascade.ALL,
        relationship = {
            @Relationship(fromField = "CODPRODUTO", toField = "CODPRODUTO")
        }
    )
    private List<TdcXyzVinculoProduto> vinculos;
}
```

## Entidade nativa com @Builder e métodos de domínio

```java

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JapeEntity(entity = "CabecalhoNota", table = "TGFCAB",
            isNativeTable = true, isNativeInstance = true)
public class CabecalhoNota {

    @Id
    @Column(name = "NUNOTA")
    private BigDecimal nuNota;

    @Column(name = "TIPMOV")
    private TipoMovimento tipoMovimento;

    @Column(name = "XYZ_STATUS")
    private StatusProcesso status;

    @OneToOne
    @JoinColumn(name = "CODPARC", referencedColumnName = "CODPARC")
    private Parceiro parceiro;

    @OneToOne
    @JoinColumns({
        @JoinColumn(name = "CODTIPOPER", referencedColumnName = "CODTIPOPER"),
        @JoinColumn(name = "DHALTER", referencedColumnName = "DHTIPOPER")
    })
    private TipoOperacao tipoOperacao;

    @OneToMany(relationship = {
        @Relationship(fromField = "NUNOTA", toField = "NUNOTA")
    })
    private List<ItemNota> itens;

    // Métodos de domínio
    public Boolean isVenda() {
        return this.tipoMovimento == TipoMovimento.PEDIDO_VENDA
            || this.tipoMovimento == TipoMovimento.VENDA;
    }

    public void cancelar(Timestamp dataCancelamento) {
        this.dhCancelamento = dataCancelamento;
        this.status = StatusProcesso.CANCELADO;
    }
}
```

## Entidade somente com PK composta (sem campos próprios)

```java

@Data
@NoArgsConstructor
@AllArgsConstructor
@JapeEntity(entity = "TdcXyzVinculo", table = "TDCXYZVIN")
public class TdcXyzVinculo {

    @Id
    private TdcXyzVinculoId embeddedId;
}
```

## Enum (Value Object)

```java

@AllArgsConstructor
@Getter
public enum StatusProcesso {
    PENDENTE("P"),
    EMITIDO("E"),
    CANCELADO("C");

    private final String value;
}
```

## PK Composta (`@Embeddable`)

```java

@Data
@AllArgsConstructor
@NoArgsConstructor
@Embeddable
public class ItemNotaId {

    @Column(name = "NUNOTA")
    private BigDecimal nuNota;

    @Column(name = "SEQUENCIA")
    private BigDecimal sequencia;
}
```

