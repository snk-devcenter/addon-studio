---
name: mapstruct
description: MapStruct @Mapper for Sankhya Addon Studio (componentModel=jakarta, injectionStrategy=CONSTRUCTOR, create/merge patterns) for DTO<->Entity conversion. Use when writing mappers or editing files matching `*Mapper.java`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# MapStruct ? Addon Studio 2.0

MapStruct = biblioteca padrao pra conversao DTO <-> Entidade Dominio. **Nunca** faca mapper manual — use MapStruct.

> **Referencia complementar:** veja `dependency-injection` pra como mappers registram no container Guice.
>
> **Escopo:** arquivo define so regras **genericas** MapStruct. Regras negocio, filtros plataforma, convencoes dominio especificas ficam em override por projeto (fora desta skill).

---

## 1. Configuracao Global do Projeto

Projeto ja define flags globais compilacao no `build.gradle`:

```groovy
dependencies {
    implementation 'org.mapstruct:mapstruct:1.5.5.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'

    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok-mapstruct-binding:0.2.0'
}

tasks.withType(JavaCompile) {
    options.compilerArgs += [
        "-Amapstruct.defaultComponentModel=jakarta",
        "-Amapstruct.unmappedTargetPolicy=IGNORE"
    ]
}
```

### O que cada flag faz

| Flag | Valor | Efeito |
|:-----|:------|:-------|
| `defaultComponentModel` | `jakarta` | MapStruct gera implementacoes com `@Named` pra registro automatico Guice. **NAO sobrescrever** nos mappers. |
| `unmappedTargetPolicy` | `IGNORE` | Campos target sem mapeamento explicito ignorados sem erro compilacao. |
| `lombok-mapstruct-binding` | `0.2.0` | Garante compatibilidade Lombok (getters/setters gerados) com MapStruct (annotation processor). |

> **ATENCAO — Nao confunda `componentModel` com `injectionStrategy`:**
>
> | Parametro | Configurado globalmente? | Regra |
> |:----------|:-------------------------|:------|
> | `componentModel` | **SIM** — `jakarta` no `build.gradle` | **NUNCA** declare no `@Mapper` individual. Declarar sobrescreve global. |
> | `injectionStrategy` | **NAO** — sem flag global | **SEMPRE** declare `InjectionStrategy.CONSTRUCTOR` em mapper `abstract class` (com `@Inject` repository) ou que use `uses = {...}`. |
> | repositories em `abstract class` | **N/A** | **SEMPRE** use field injection (`@Inject` no campo). Limitacao MapStruct: processador nao gera `super(...)` com parametros construtor classe abstrata, impossibilita constructor injection pra repositorios. |
>
> **IMPORTANTE — componentModel:** `componentModel` **NUNCA** declare no `@Mapper` individual. Ja global como `jakarta` em `build.gradle`. Declarar — mesmo com mesmo valor `"jakarta"` — sobrescreve global, causa conflitos injecao ou falhas silenciosas no Guice.
>
> **IMPORTANTE — injectionStrategy:** `injectionStrategy` **NAO** global. Declare explicito como `InjectionStrategy.CONSTRUCTOR` em mapper que:
> - `abstract class` com `@Inject` (repositorios ou deps), OU
> - use `uses = {...}` com componentes externos.
>
> Omitir = field injection Guice sem garantia ordem inicializacao.

---

## 2. Tipos de Mapper

**4 configuracoes** mapper no projeto, por contexto:

| Tipo | `@Mapper(...)` | Classe | Quando usar |
|:-----|:---------------|:-------|:------------|
| **Simples** | `@Mapper` | `interface` | Mappers sem deps externas |
| **Com `uses`** | `@Mapper(uses = {...}, injectionStrategy = CONSTRUCTOR)` | `interface` | Mappers que usam classes auxiliares `@Component` |
| **Com `uses` + `builder` desabilitado** | `@Mapper(uses = {...}, injectionStrategy = CONSTRUCTOR, builder = @Builder(disableBuilder = true))` | `abstract class` | Mappers com `@AfterMapping` ou logica custom que exige setters |
| **Com Repository (create/merge)** | `@Mapper(uses = {...}, injectionStrategy = CONSTRUCTOR, builder = @Builder(disableBuilder = true))` | `abstract class` + `@Inject` field (repository) | Mappers integracao com upsert: busca por chave externa/negocial, atualiza se existe ou cria se nao existe |

---

## 3. Mapper Simples (`interface`)

Conversoes diretas sem deps externas.

```java
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface MeuRestMapper {

    MeuDomainObj toDomain(MeuRequest dto);

    @Mapping(source = "campo1", target = "campoDto1")
    @Mapping(source = "campo2", target = "campoDto2")
    MeuResponse toResponse(MeuDomainObj domain);
}
```

**Caracteristicas:**
- `interface`.
- So `@Mapper` (sem params).
- Injetavel direto via `@Inject` construtor.

---

## 4. Mapper com `uses` (`interface` + `@Component`)

Mapper precisa classe auxiliar pra transformacoes custom (ex: normalizar strings, parsear datas).

### Classe auxiliar (`@Component`)

```java
import br.com.sankhya.studio.stereotypes.Component;

@Component
public class StringMappingNormalizer {

    public String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
```

### Mapper usando classe auxiliar

```java
import org.mapstruct.InjectionStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
    uses = {StringMappingNormalizer.class},
    injectionStrategy = InjectionStrategy.CONSTRUCTOR
)
public interface MeuIntegrationMapper {

    @Mapping(source = "idExterno", target = "idOrigem")
    @Mapping(source = "nome", target = "descricao")
    @Mapping(target = "ativo", constant = "true")
    MeuDomainObj toDomain(MeuExternalDTO dto);
}
```

**Regras obrigatorias:**
- Classe em `uses` **deve** ser `@Component` (pra Guice resolver).
- `injectionStrategy = InjectionStrategy.CONSTRUCTOR` **obrigatorio** com `uses`.
- MapStruct aplica metodos auto quando tipos entrada/saida batem (ex: `String -> String` usa `normalize`).

---

## 5. Mapper com Builder Desabilitado (`abstract class`)

Mapper precisa `@AfterMapping`, logica custom em metodos concretos, ou target usa Builder e voce precisa setters.

```java
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
    uses = {StringMappingNormalizer.class},
    injectionStrategy = org.mapstruct.InjectionStrategy.CONSTRUCTOR,
    builder = @org.mapstruct.Builder(disableBuilder = true)
)
public abstract class MeuMapper {

    @Mapping(source = "idExterno", target = "cultura.idOrigem")
    @Mapping(source = "idAlvo", target = "alvo.idOrigem")
    @Mapping(source = "doseMin", target = "doseMinima")
    public abstract MeuDomainObj toDomain(MeuExternalDTO dto);
}
```

**Quando usar:**
- Target tem `@Builder` (Lombok) e MapStruct deve usar setters em vez do Builder.
- Precisa `@AfterMapping` pra pos-processamento.
- Classe tem que ser `abstract class` (nao `interface`) pra ter metodos concretos.

---

## 6. Padroes de Mapeamento

### 6.1 Campos com nomes diferentes

```java
@Mapping(source = "nomeExterno", target = "nomeInterno")
MeuDomainObj toDomain(MeuDTO dto);
```

### 6.2 Campos nested (objetos aninhados)

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

### 6.3 Ignorar campos target

```java
@Mapping(target = "campoIgnorado", ignore = true)
@Mapping(target = "outroIgnorado", ignore = true)
MeuDomainObj toDomain(MeuDTO dto);
```

> Com `unmappedTargetPolicy=IGNORE` global, campos nao mapeados ja ignorados. Use `ignore = true` quando quiser **explicito** sobre intencao.

### 6.4 Valores constantes

```java
@Mapping(target = "ativo", constant = "true")
MeuDomainObj toDomain(MeuDTO dto);
```

> Valor sempre `String`. MapStruct converte pro tipo target auto (`"true"` -> `Boolean.TRUE`).

### 6.5 Mapeamento bidirecional (toDomain + fromDomain)

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

### 6.6 Campos com mesmo nome (mapeamento implicito)

Source e target com mesmo nome e tipo = mapeamento **automatico**. Sem `@Mapping` necessario.

```java
// Se MeuDTO.nome e MeuDomainObj.nome existem com mesmo tipo:
// NAO precisa: @Mapping(source = "nome", target = "nome")
MeuDomainObj toDomain(MeuDTO dto);
```

> `@Mapping` explicito pra campos mesmo nome **permitido** pra documentar, nao obrigatorio.

### 6.7 Padrao Create/Merge (Upsert) com Repository

Mappers integracao podem fazer upsert no `toDomain`, quando fluxo exigir reaproveitar registro existente.

#### Como funciona (generico)

1. Camada chamadora resolve contexto integracao (tenant, origem, ambiente etc.) e chama mapper.
2. Mapper consulta repository por chave negocio/externa estavel.
3. Encontrou: aplica `doUpdate`. Nao encontrou: cria com `doMap`.

#### Regras gerais

- Chave externa/negocial **nao e PK interna**.
- PK interna segue padrao ecossistema (`COD*` cadastros ou `NU*` movimentos/documentos) e gera automatica.
- Nunca sobrescrever PK interna no mapper (`@Mapping(target = "codEntidade", ignore = true)` ou equivalente).

#### Repository: exemplo generico

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

#### Mapper: padrao completo

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

---

## 7. Organizacao

> Skill nao opina sobre pacotes. Padrao comum:
>
> - **REST mappers**: junto do Controller (DTO Request/Response ↔ objeto de dominio).
> - **Integration mappers**: junto do Gateway concreto da plataforma externa (DTO da API ↔ objeto de dominio).
> - **Classes auxiliares compartilhadas** (`@Component` usados via `uses = {...}`): em local de utilidades compartilhadas.

### Convencao de nome

| Tipo de Mapper                | Convencao de nome                  | Exemplo                  |
|:------------------------------|:-----------------------------------|:-------------------------|
| REST (Controller)             | `<Feature>RestMapper`              | `PedidoRestMapper`       |
| Integracao externa            | `<Plataforma><Entidade>Mapper`     | `PlataformaXProdutoMapper` |
| Classe auxiliar compartilhada | Nome descritivo                    | `StringMappingNormalizer` |

---

## 8. Convencao de Metodos

| Direcao | Nome do metodo | Assinatura |
|:--------|:---------------|:-----------|
| DTO externo -> Dominio | `toDomain` | `DomainObj toDomain(ExternalDTO dto)` |
| Dominio -> DTO externo | `fromDomain` | `ExternalDTO fromDomain(DomainObj domain)` |
| Request -> Dominio | `to<NomeObj>` | `DomainObj to<NomeObj>(Request dto)` |
| Dominio -> Response | `to<NomeResponse>` | `Response to<NomeResponse>(DomainObj domain)` |

### Exemplos

```java
// Integracao: DTO externo <-> Dominio
Produto toDomain(PlataformaXProduto dto);
PlataformaXProduto fromDomain(Produto domain);

// REST: Request -> Dominio, Dominio -> Response
Pedido toPedido(PedidoRequest dto);
EmitirPedidoResponse toEmitirPedidoResponse(Pedido pedido);
```

---

## 9. Injecao e Uso

### No Controller (via construtor)

```java
@Controller(serviceName = "MeuControllerSP", transactionType = EJBTransactionType.Supports)
public class MeuController {

    private final MeuRestMapper mapper;

    @Inject
    public MeuController(MeuRestMapper mapper) {
        this.mapper = mapper;
    }

    @Transactional
    public MeuResponse executar(MeuRequest request) {
        MeuDomainObj domain = mapper.toDomain(request);
        // ... logica ...
        return mapper.toResponse(domain);
    }
}
```

### No Gateway de integracao (via construtor)

```java
public class MeuPlatformGateway implements MeuGateway {

    private final MeuApiClient client;
    private final RetrofitCallExecutor executor;
    private final MeuPlatformMapper mapper;

    @Inject
    public MeuPlatformGateway(MeuApiClient client,
                               RetrofitCallExecutor executor,
                               MeuPlatformMapper mapper) {
        this.client = client;
        this.executor = executor;
        this.mapper = mapper;
    }

    @Override
    public List<MeuDomainObj> findAll() {
        MeuApiResponse root = executor.execute(client.buscarTodos());
        return root.getItens().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
}
```

> Mappers injetam como qualquer dep — `@Inject` via construtor. Guice resolve implementacao gerada auto.

---

## 10. Fluxo de Decisao: Qual tipo de Mapper usar?

```
Mapper de integracao com plataforma externa (toDomain precisa de upsert)?
|
+-- SIM --> abstract class + @Inject repository + toDomain concreto com create/merge
|           @Mapper(uses={...}, injectionStrategy=CONSTRUCTOR, builder=@Builder(disableBuilder=true))
|
+-- NAO --> Precisa de classe auxiliar em `uses`?
            |
            +-- NAO --> @Mapper (interface simples)
            |
            +-- SIM --> Precisa de @AfterMapping ou logica customizada?
                        |
                        +-- NAO --> @Mapper(uses={...}, injectionStrategy=CONSTRUCTOR) [interface]
                        |
                        +-- SIM --> @Mapper(uses={...}, injectionStrategy=CONSTRUCTOR,
                                           builder=@Builder(disableBuilder=true)) [abstract class]
```

---

## 11. Checklist

### Novo mapper

1. Identificar tipo correto (simples, com `uses`, builder desabilitado, ou create/merge com repository).
2. Mapper integracao com plataforma externa: `abstract class` com `@Inject` repository.
3. Declarar `interface` (ou `abstract class` se precisar builder desabilitado ou repository).
4. NAO declarar `componentModel` — ja global como `jakarta` em `build.gradle`. Nem com valor `"jakarta"`.
5. Se `abstract class` (com `@Inject` repository) OU usar `uses`, declare `injectionStrategy = InjectionStrategy.CONSTRUCTOR`.
6. Se usar `uses`, garanta classes referenciadas sao `@Component`.
7. Mapear campos nomes diferentes via `@Mapping(source, target)`.
8. Usar `target = "nested.field"` pra objetos aninhados.
9. Usar `ignore = true` pra campos nao mapeaveis.
10. Usar `constant = "valor"` pra valores fixos.
11. Pacote conforme arquitetura do projeto (skill nao opina).
12. Injetar via construtor com `@Inject`.

### Mapper de integracao (create/merge)

1. Declarar `abstract class`.
2. Adicionar `injectionStrategy = InjectionStrategy.CONSTRUCTOR` no `@Mapper` — obrigatorio pra `abstract class` com `@Inject`.
3. Adicionar `builder = @Builder(disableBuilder = true)` no `@Mapper`.
3. Injetar repository com `@Inject` como campo protegido — field injection obrigatoria por limitacao MapStruct (nota 6.7).
5. Implementar `toDomain()` concreto: `findBy<ChaveExterna>()` ? `doUpdate` se existe, `doMap` se nao.
6. Declarar `doMap(DTO)` `protected abstract` com `@Mapping(target="<pkInterna>", ignore=true)`.
7. Declarar `doUpdate(@MappingTarget Entity, DTO)` `protected abstract` com `@Mapping(target="<pkInterna>", ignore=true)`.
8. No `doUpdate`, ignorar campos dominio que origem externa nao deve sobrescrever.
9. Direcao inversa (export): declare `fromDomain(Entity)` `public abstract`.

### Revisao de mapper existente

1. Verificar se campos source estao mapeados no target (ou ignorados explicito).
2. Verificar campos nested (`a.b.c`) corretos.
3. Verificar `uses` tem `injectionStrategy = CONSTRUCTOR`. Se `abstract class` com `@Inject` repository, tambem tem `injectionStrategy = CONSTRUCTOR`.
4. Verificar que NAO tem `componentModel` no `@Mapper` (nem `"jakarta"` — ja global).
5. Mapper integracao: verificar se implementa create/merge com repository.

---

## 12. Erros Comuns

| Erro | Correcao |
|:-----|:---------|
| Declarar `componentModel` no `@Mapper` (qualquer valor, incluindo `"jakarta"`) | Remover — ja global como `jakarta` em `build.gradle`. Declarar sobrescreve global. |
| Usar `uses` sem `injectionStrategy = CONSTRUCTOR` | Adicionar `injectionStrategy = InjectionStrategy.CONSTRUCTOR`. |
| `abstract class` com `@Inject` repository sem `injectionStrategy = CONSTRUCTOR` | Adicionar `injectionStrategy = InjectionStrategy.CONSTRUCTOR` — nao e global. |
| Constructor injection (`@Inject` no construtor da `abstract class`) pra repositorios | Reverter pra field injection (`@Inject` no campo). MapStruct nao gera `super(...)` com params do construtor da abstrata; classe gerada nao instancia. |
| Classe em `uses` sem `@Component` | Adicionar `@Component` na auxiliar. |
| `@AfterMapping` nao executado | Adicionar `builder = @Builder(disableBuilder = true)` no `@Mapper` e usar `abstract class`. |
| Mapper `abstract class` sem `builder = @Builder(disableBuilder = true)` | Adicionar atributo ? sem ele MapStruct pode usar Builder Lombok e ignorar setters. |
| Mapper manual (`new MeuDTO(); dto.setX(...)`) | Usar MapStruct. Nunca mapper manual. |
| Campo target nao populado | Verificar se `@Mapping` correto. Mesmo nome = automatico; diferentes precisam `@Mapping` explicito. |
| Erro compilacao "Ambiguous mapping methods" | Renomear metodos pra evitar conflitos assinatura ou usar `@Named` pra qualificar. |
| Erro compilacao com Lombok | Verificar `lombok-mapstruct-binding` nas deps do `annotationProcessor`. |


## Related Skills

- `dependency-injection` — mappers registram no container Guice
- `controller` — controllers consomem mappers para conversão DTO ↔ entidade
- `entity` — entidades-alvo dos mappers
