# ADDON.md — Instruções do plugin Sankhya Addon Studio para o agente

> Arquivo gerado pela skill `/addon-studio:init`. **Não edite à mão** — re-rode a skill para atualizar. Customizações específicas do projeto vão no `CLAUDE.md` da raiz, fora deste arquivo.

Projeto **Sankhya Addon Studio 2.0** — plugin Gradle `br.com.sankhya.addonstudio` aplicado no `build.gradle`/`build.gradle.kts`.

Antes de gerar ou alterar código, case o domínio do artefato com a skill do plugin cujos gatilhos batem — cada skill declara os seus na própria `description`, inclusive quando **não** deve ser usada. Delegação a sub-agent: os `description` deles dizem quando entram.

## Regras universais (sempre ativas)

- **Java 8 estrito** — sem `var`, `List.of`/`Map.of`, `String.isBlank`, `Stream.toList`, `Optional.orElseThrow()` sem argumento (Java 10; a sobrecarga `orElseThrow(Supplier)` é Java 8 e é permitida), records, sealed, text blocks.
- **ISO-8859-1** em todo `.java`/`.xml`/`.kt`/`.properties`. O hook do plugin converte após cada `Write`/`Edit`; se ele abortar avisando `U+FFFD`, restaure o trecho acentuado (`git checkout --`) e reaplique a edição. Exceção: este `ADDON.md` fica em UTF-8.
- **Persistência JAPE** — `@JapeEntity` + interface estendendo `JapeRepository`, nunca `@Entity` JPA padrão nem `JapeWrapper`/`EntityFacade` direto em controller.
- **DI Guice** — `@Inject` de `com.google.inject` via construtor, `private final`, nunca `javax.inject` nem `new` em dependência gerenciada.
- **Logging** — `@Log` Lombok + `java.util.logging`, nunca SLF4J nem `System.out`.
- **Exceções** — tipadas estendendo `RuntimeException` com mensagem de negócio, nunca `RuntimeException` cru.
- **API do SDK = skill, não jar.** As skills do plugin são a fonte de verdade de **qualquer** símbolo do SDK (import, assinatura, anotação, classe, enum): invoque a skill focada — não improvise convenções de outros stacks (Spring Boot, Quarkus, JPA padrão) nem inspecione/decompile os `.jar` do SDK (`javap`, `unzip`, cache Gradle). Símbolo sem skill: **pergunte ao dev**; jar só em divergência comprovada entre skill e build, reportando antes.
- **Skill é fonte de verdade da API, nunca da arquitetura.** Estrutura de pacotes, camadas, nomes de diretório e estilo de design (MVC, DDD, Clean Arch, Hexagonal) são decisão do dev/projeto: espelhe a organização que já existe no repositório; sem precedente, **pergunte**. Exemplo de skill ilustra API do SDK — `package`, nome de classe e caminho em snippet não são recomendação de layout e não devem ser copiados como default.
- Conflito regra-do-projeto × skill: **prevalece a skill**, exceto override explícito no `CLAUDE.md` da raiz.
