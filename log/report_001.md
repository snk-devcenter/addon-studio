# Relatório de Erros de Build — Addon Studio 2.0

**Projeto:** sop_ciot | **Data:** 2026-05-04 | **Testador:** victor.goncalves@sankhya.com.br

---

## Erro 1 — `@ControllerAdvice`: métodos `@ExceptionHandler` não podem ser `void`

**Arquivo:** `instructions/controller-instructions.md`

**O que as instruções dizem:**
```java
@ExceptionHandler(EntityNotFoundException.class)
public void handleNotFound(EntityNotFoundException e) {
    log.log(Level.INFO, "Entidade nao encontrada: {0}", e.getMessage());
    throw e;
}
```

**Erro do KSP:**
```
Função handleDomainException deve retornar um objeto ou um primitivo (nao void ou Unit).
```

**Correção aplicada:** Trocar `void` por `String` (retornando a mensagem).

**Solicitação:** Atualizar o exemplo do `@ControllerAdvice` para usar `String` como tipo de retorno, documentando que o KSP rejeita `void`/`Unit`.

---

## Erro 2 — `@JapeEntity` em tabelas nativas requer `isNativeTable = true`

**Arquivo:** `instructions/entity-instructions.md`

**O que as instruções dizem:**
> `@JapeEntity` só tem `entity` e `table` — nenhum outro atributo.

**Erro do KSP:**
```
Já existe uma entidade nativa com o nome CabecalhoNota. Favor inserir outro nome 
para a entidade, ou na anotação @JapeEntity marcar isNativeTable = true.
```

**Correção aplicada:** `@JapeEntity(entity = "CabecalhoNota", table = "TGFCAB", isNativeTable = true)`

**Solicitação:** Documentar o atributo `isNativeTable = true` como **obrigatório** ao mapear tabelas nativas do Sankhya (ex.: `TGFCAB`, `TGFFIN`, `TGFORD`, `TGFVEI`, `TGFEMP`, `TGFPAR`). Adicionar regra na tabela de "Anotações Permitidas" e um exemplo dedicado para entidade nativa.

---

## Erro 3 — `@NativeQuery` está no pacote errado nas instruções

**Arquivo:** `instructions/repository-instructions.md`

**O que as instruções dizem:** Os exemplos usam `@NativeQuery` sem mostrar o import. O pacote `br.com.sankhya.sdk.data.repository` (onde fica `JapeRepository`) levou à suposição errada.

**Erro do compilador:**
```
error: cannot find symbol
import br.com.sankhya.sdk.data.repository.NativeQuery;
```

**Correção aplicada:** `import br.com.sankhya.studio.persistence.NativeQuery`

**Solicitação:** Adicionar o import correto explicitamente em todos os exemplos com `@NativeQuery` e `@NativeQuery.Result`. Também adicionar tabela de imports por anotação (similar à tabela de `@Criteria`/`@Parameter`).

---

## Erro 4 — `@Modifying` não aceita `int` como retorno

**Arquivo:** `instructions/repository-instructions.md`

**O que as instruções dizem:**
```java
@Modifying
@NativeQuery("UPDATE ... WHERE ...")
int reajustarPrecoPorGrupo(...);
```

**Erro do KSP:**
```
Métodos anotados com @Modifying deve retornar Boolean ou void
```

**Correção aplicada:** Trocar `int` por `void`.

**Solicitação:** Corrigir todos os exemplos de `@Modifying` para usar `void` ou `Boolean`. Remover o uso de `int` como tipo de retorno.

---

## Erro 5 — `JapeRepository.findByPK()` retorna `T`, não `Optional<T>`

**Arquivo:** `instructions/repository-instructions.md`

**O que as instruções dizem:**
> `findByPK(ID id)` — Busca por PK → retorna `Optional<T>`

**Erro do compilador:**
```
error: cannot find symbol
  symbol:   method orElseThrow(()->new CiotDomainException(...))
  location: class TdcCioOrdemCarga
```

O retorno real é `T` (nullable), não `Optional<T>`. Chamar `.orElseThrow()`, `.map()` ou `.ifPresent()` falha em compilação.

**Correção aplicada:** Substituir por null-checks explícitos:
```java
// Errado (conforme instruções):
repository.findByPK(id).orElseThrow(() -> new MinhaException("..."));

// Correto (comportamento real do SDK):
Entidade e = repository.findByPK(id);
if (e == null) throw new MinhaException("...");
```

**Solicitação:** Corrigir a tabela de métodos herdados e todos os exemplos. Documentar que `findByPK` retorna `T` (podendo ser `null`) e que null-checks devem ser feitos manualmente.

---

## Erro 6 — Métodos do `JapeRepository` lançam `Exception` checked

**Arquivo:** `instructions/repository-instructions.md`

**O que as instruções dizem:** Nada. Nenhum exemplo menciona tratamento de exceções checked nos métodos do repositório.

**Erro do compilador:**
```
error: unreported exception Exception; must be caught or declared to be thrown
    ordemCargaRepository.save(ordem);
```

Todos os métodos herdados (`findByPK`, `save`, `delete`, `findAll`) lançam `Exception` checked, exigindo `throws Exception` em toda a cadeia de chamada (service, controller).

**Solicitação:** Adicionar coluna "Lança" na tabela de métodos CRUD herdados, documentando que todos lançam `Exception` checked. Atualizar os exemplos de `@Component` e `@Controller` para incluir `throws Exception` nas assinaturas dos métodos que usam repositórios.

---

**Total: 6 erros não documentados.** Todos afetam o fluxo de implementação desde a primeira compilação.
