# ADDON.md — Instruções do plugin Sankhya Addon Studio para o agente

> Arquivo gerado pela skill `/addon-studio:init`. **Não edite à mão** — re-rode a skill para atualizar. Customizações específicas do projeto vão no `CLAUDE.md` (ou `AGENTS.md`) da raiz, fora deste arquivo.

Projeto **Sankhya Addon Studio 2.0** — plugin Gradle `br.com.sankhya.addonstudio` aplicado no `build.gradle`/`build.gradle.kts`. As skills do plugin `addon-studio` são a **fonte de verdade** da API do SDK: siga-as, não improvise convenções de outros stacks (Spring Boot, Quarkus, JPA padrão) **nem vá decompilar os `.jar` do SDK** — os jars são artefato de build, a referência de assinatura/import é a skill.

## Roteamento

Antes de gerar ou alterar código, identifique o domínio do artefato e **invoque a skill focada correspondente** — cada skill do plugin declara seus próprios gatilhos na `description`; case o domínio (entidade, repositório, controller, dicionário de dados, dbscript, job, etc.) com a skill cujos gatilhos batem. Para planejamento end-to-end, regras universais e naming `<PRX><MOD3><CTX>`, invoque a skill `addon-studio`.

## Regras universais (sempre ativas)

- **Java 8 estrito** — sem `var`, `List.of`/`Map.of`, `String.isBlank`, `Stream.toList`, `Optional.orElseThrow(Supplier)`, records, sealed, text blocks.
- **ISO-8859-1** em todo `.java`/`.xml`/`.kt`/`.properties`. Após cada `Write`/`Edit` nesses arquivos, garantir Latin-1 (skill `encoding`). Exceção: este `ADDON.md` fica em UTF-8.
- **Persistência JAPE** — `@JapeEntity` + interface estendendo `JapeRepository`, nunca `@Entity` JPA padrão nem `JapeWrapper`/`EntityFacade` direto em controller.
- **DI Guice** — `@Inject` de `com.google.inject` via construtor, `private final`, nunca `javax.inject` nem `new` em dependência gerenciada.
- **Logging** — `@Log` Lombok + `java.util.logging`, nunca SLF4J nem `System.out`.
- **Exceções** — tipadas estendendo `RuntimeException` com mensagem de negócio, nunca `RuntimeException` cru.
- **API do SDK = skill, não jar.** A regra vale para **qualquer** símbolo do SDK — anotação, classe, interface, classe-base, enum, método ou caminho de import — **sem exceção**; os exemplos abaixo são ilustração, não a lista fechada. Para descobrir o import ou a assinatura de algo do SDK (`@JapeEntity`, `@Controller`, `@Job`/`IJob`, `@Repository`, `@Component`, `@BusinessRule`, `@ActionButton`, `@Transactional`, …), **invoque a skill focada** — ela traz os imports e assinaturas reais do SDK. **Nunca** decompile nem inspecione o `.jar` do SDK (`javap`, `unzip`, leitura de classe no cache Gradle) para "achar" a convenção: é lento, gasta tokens e arrisca ler classe legada/errada. Símbolo não coberto por nenhuma skill: **pergunte ao dev** — não vá ao jar. Jar só em divergência comprovada entre skill e build, e mesmo assim reporte ao dev antes.
- Conflito regra-do-projeto × skill: **prevalece a skill**, exceto override explícito no `CLAUDE.md`/`AGENTS.md` da raiz.

## Delegação a sub-agents (Claude Code) — trigger é a natureza do artefato, não o formato do pedido

- Trio CRUD (XML dicionário + dbscript + `@JapeEntity`) → `entity-architect`
- `dbscripts/` isolado (ALTER, seed, índice) → `dbscript-builder`
- Endpoint REST (`@Controller` + DTOs + mapper) → `controller-designer`
- Testes JUnit + Mockito → `test-writer`
- Erro / stacktrace / build falhando → `troubleshooter`
- Revisão pré-commit → `addon-reviewer`