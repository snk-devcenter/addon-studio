# ADDON.md — Instruções do plugin Sankhya Addon Studio para o agente

> Arquivo gerado pela skill `/addon-studio:init`. **Não edite à mão** — re-rode a skill para atualizar. Customizações específicas do projeto vão no `CLAUDE.md` da raiz, fora deste arquivo.

Projeto **Sankhya Addon Studio 2.0** — plugin Gradle `br.com.sankhya.addonstudio` aplicado no `build.gradle`/`build.gradle.kts`.

## Roteamento

Antes de gerar ou alterar código, identifique o domínio do artefato e **invoque a skill focada correspondente** — cada skill do plugin declara seus próprios gatilhos na `description`; case o domínio (entidade, repositório, controller, dicionário de dados, dbscript, job, etc.) com a skill cujos gatilhos batem. Para planejamento end-to-end, regras universais e naming `<PRX><MOD3><CTX>`, invoque a skill `addon-studio`.

## Regras universais (sempre ativas)

- **Java 8 estrito** — sem `var`, `List.of`/`Map.of`, `String.isBlank`, `Stream.toList`, `Optional.orElseThrow()` sem argumento (Java 10; a sobrecarga `orElseThrow(Supplier)` é Java 8 e é permitida), records, sealed, text blocks.
- **ISO-8859-1** em todo `.java`/`.xml`/`.kt`/`.properties`. Após cada `Write`/`Edit` nesses arquivos, garantir Latin-1 (skill `encoding`). Exceção: este `ADDON.md` fica em UTF-8.
- **Persistência JAPE** — `@JapeEntity` + interface estendendo `JapeRepository`, nunca `@Entity` JPA padrão nem `JapeWrapper`/`EntityFacade` direto em controller.
- **DI Guice** — `@Inject` de `com.google.inject` via construtor, `private final`, nunca `javax.inject` nem `new` em dependência gerenciada.
- **Logging** — `@Log` Lombok + `java.util.logging`, nunca SLF4J nem `System.out`.
- **Exceções** — tipadas estendendo `RuntimeException` com mensagem de negócio, nunca `RuntimeException` cru.
- **API do SDK = skill, não jar.** As skills do plugin são a fonte de verdade de **qualquer** símbolo do SDK (import, assinatura, anotação, classe, enum): invoque a skill focada — não improvise convenções de outros stacks (Spring Boot, Quarkus, JPA padrão) nem inspecione/decompile os `.jar` do SDK (`javap`, `unzip`, cache Gradle). Símbolo sem skill: **pergunte ao dev**; jar só em divergência comprovada entre skill e build, reportando antes.
- Conflito regra-do-projeto × skill: **prevalece a skill**, exceto override explícito no `CLAUDE.md` da raiz.

## Delegação a sub-agents (Claude Code) — trigger é a natureza do artefato, não o formato do pedido

- Trio CRUD (XML dicionário + dbscript + `@JapeEntity`) → `entity-architect`
- `dbscripts/` isolado (ALTER, seed, índice) → `dbscript-builder`
- Endpoint REST (`@Controller` + DTOs + mapper) → `controller-designer`
- Testes JUnit + Mockito → `test-writer`
- Erro / stacktrace / build falhando → `troubleshooter`
- Revisão pré-commit → `addon-reviewer`