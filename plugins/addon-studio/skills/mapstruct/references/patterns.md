# Padroes de Mapeamento — MapStruct

## Campos com nomes diferentes

```java
@Mapping(source = "nomeExterno", target = "nomeInterno")
MeuDomainObj toDomain(MeuDTO dto);
```

## Campos nested (objetos aninhados)

Mapear campo flat DTO pra campo dentro objeto aninhado no dominio:

```java
// DTO.codCliente -> Domain.cliente.idCliente
@Mapping(source = "codCliente", target = "cliente.idCliente")
@Mapping(source = "codVendedor", target = "vendedor.idVendedor")
MeuExternalObj fromDomain(MeuDomainObj domain);
```

Tambem le de nested:

```java
// Domain.municipio.ibge -> DTO.codigoIbge
@Mapping(source = "municipio.ibge", target = "codigoIbge")
MeuDTO fromDomain(MeuDomainObj domain);
```

## Ignorar campos target

```java
@Mapping(target = "campoIgnorado", ignore = true)
@Mapping(target = "outroIgnorado", ignore = true)
MeuDomainObj toDomain(MeuDTO dto);
```

> Com `unmappedTargetPolicy=IGNORE` global, campos nao mapeados ja ignorados. Use `ignore = true` quando quiser **explicito** sobre intencao.

## Valores constantes

```java
@Mapping(target = "ativo", constant = "true")
MeuDomainObj toDomain(MeuDTO dto);
```

> Valor sempre `String`. MapStruct converte pro tipo target auto (`"true"` -> `Boolean.TRUE`).

## Mapeamento bidirecional (toDomain + fromDomain)

Integracao converte nos dois sentidos:

```java
@Mapper(
    uses = {StringMappingNormalizer.class},
    injectionStrategy = InjectionStrategy.CONSTRUCTOR
)
public interface MeuMapper {

    // API externa -> Dominio
    @Mapping(source = "idExterno", target = "codInterno")
    @Mapping(source = "nome", target = "descricao")
    MeuDomainObj toDomain(MeuExternalDTO dto);

    // Dominio -> API externa
    @Mapping(source = "codInterno", target = "idExterno")
    @Mapping(source = "descricao", target = "nome")
    @Mapping(target = "campoSomenteExterno", ignore = true)
    MeuExternalDTO fromDomain(MeuDomainObj domain);
}
```

## Campos com mesmo nome (mapeamento implicito)

Source e target com mesmo nome e tipo = mapeamento **automatico**. Sem `@Mapping` necessario.

```java
// Se MeuDTO.nome e MeuDomainObj.nome existem com mesmo tipo:
// NAO precisa: @Mapping(source = "nome", target = "nome")
MeuDomainObj toDomain(MeuDTO dto);
```

> `@Mapping` explicito pra campos mesmo nome **permitido** pra documentar, nao obrigatorio.

## Padrao Create/Merge (Upsert) com Repository

Mappers integracao podem fazer upsert no `toDomain`, quando fluxo exigir reaproveitar registro existente.

### Como funciona (generico)

1. Camada chamadora resolve contexto integracao (tenant, origem, ambiente etc.) e chama mapper.
2. Mapper consulta repository por chave negocio/externa estavel.
3. Encontrou: aplica `doUpdate`. Nao encontrou: cria com `doMap`.

### Regras gerais

- Chave externa/negocial **nao e PK interna**.
- PK interna segue padrao ecossistema (`COD*` cadastros ou `NU*` movimentos/documentos) e gera automatica.
- Nunca sobrescrever PK interna no mapper (`@Mapping(target = "codEntidade", ignore = true)` ou equivalente).

### Repository: exemplo generico

```java
import br.com.sankhya.studio.persistence.Criteria;
import br.com.sankhya.sdk.data.repository.JapeRepository;
import br.com.sankhya.studio.stereotypes.Repository;

import java.util.Optional;

@Repository
public interface MeuEntityRepository extends JapeRepository<Integer, MeuEntity> {

    @Criteria(clause = "this.CHAVEEXTERNA = :chaveExterna")
    Optional<MeuEntity> findByChaveExterna(String chaveExterna);
}
```

### Mapper: padrao completo

```java
@Mapper(
    uses = {StringMappingNormalizer.class},
    injectionStrategy = InjectionStrategy.CONSTRUCTOR,
    builder = @org.mapstruct.Builder(disableBuilder = true)
)
public abstract class MeuIntegrationMapper {

    @Inject
    protected MeuEntityRepository entityRepository;

    // Concreto: logica de upsert
    public MeuEntity toDomain(MeuExternalDTO dto) {
        if (dto.getChaveExterna() == null) {
            return doMap(dto);
        }

        return entityRepository
            .findByChaveExterna(dto.getChaveExterna())
            .map(existing -> {
                doUpdate(existing, dto);
                return existing;
            })
            .orElseGet(() -> doMap(dto));
    }

    // Abstrato: mapeamento para criacao
    @Mapping(source = "chaveExterna", target = "chaveExterna")
    @Mapping(source = "nome", target = "descricao")
    @Mapping(target = "codEntidade", ignore = true)
    protected abstract MeuEntity doMap(MeuExternalDTO dto);

    // Abstrato: mapeamento para atualizacao (preserva campos internos)
    @Mapping(source = "chaveExterna", target = "chaveExterna")
    @Mapping(source = "nome", target = "descricao")
    @Mapping(target = "codEntidade", ignore = true)
    @Mapping(target = "campoDominio", ignore = true)
    protected abstract void doUpdate(@MappingTarget MeuEntity existing, MeuExternalDTO dto);

    // Opcional: direcao inversa
    @Mapping(source = "chaveExterna", target = "chaveExterna")
    public abstract MeuExternalDTO fromDomain(MeuEntity domain);
}
```

> **Por que field injection pro repository?** MapStruct gera classe concreta estendendo mapper abstrato. Com `componentModel=jakarta` (global), classe gerada recebe `@Named`. **Limitacao MapStruct com classes abstratas:** processador anotacoes nao gera construtor na classe filha chamando `super(...)` com parametros do construtor da abstrata — independente de `injectionStrategy = CONSTRUCTOR`. Por isso repositorios em mappers `abstract class` **devem obrigatoriamente** injetar via field (`@Inject` no campo); Guice injeta depois da construcao. Usar `@Inject` no construtor da abstrata = classe gerada nao instancia.
>
> **Por que `Optional` no `@Criteria`?** `@Criteria` com `Optional` retorna primeiro resultado ou `Optional.empty()`, permite `.map(...).orElseGet(...)` sem null checks manuais.

