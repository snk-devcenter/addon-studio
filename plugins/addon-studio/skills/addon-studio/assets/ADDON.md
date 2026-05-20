# ADDON.md — Instruções do plugin Sankhya Addon Studio para o agente

> Arquivo gerado pela skill `/addon-studio:init`. **Não edite à mão** — re-rode a skill para atualizar. Customizações específicas do projeto vão no `CLAUDE.md` (ou `AGENTS.md`) da raiz, fora deste arquivo.

Este projeto é um **Sankhya Addon Studio 2.0** (verificável pelo plugin Gradle `br.com.sankhya.addonstudio` aplicado no `build.gradle` ou `build.gradle.kts`).

**Antes de gerar ou alterar código**, o agente DEVE:

1. Carregar a skill `addon-studio` (overview, regras universais, naming convention `<PRX><MOD3><CTX>`).
2. Identificar o domínio do artefato e invocar a skill focada correspondente:
   - Entidade Java → `entity`
   - XML dicionário de dados → `data-dictionary`
   - Migration de banco → `database`
   - Repositório → `repository`
   - Endpoint REST → `controller`
   - Tratamento global de erro → `controller-advice`
   - DI Guice → `dependency-injection`
   - Mapper DTO/entidade → `mapstruct`
   - Botão de ação → `action-button`
   - Regra de negócio → `business-rule`
   - Job agendado → `job`
   - Adapter JSON → `type-adapter`
   - Injeção de configuração → `value`
   - SQL portável Oracle/MSSQL → `macros`
   - Teste → `test`
3. Após cada `Write`/`Edit` em arquivo `.java`/`.xml`/`.kt`/`.properties`, garantir ISO-8859-1 (skill `encoding`).
4. Para build/deploy, usar a skill `build` (`./gradlew clean deployAddon`).

**Anti-patterns universais** (NUNCA fazer neste projeto):

- Usar `@Entity` JPA padrão — use `@JapeEntity`.
- Usar APIs Java 11+ (`var`, `List.of`, `Optional.orElseThrow(Supplier)`, `String.isBlank`, records, etc.) — projeto é Java 8 estrito.
- Misturar `javax.inject.@Inject` com Guice — use `com.google.inject.@Inject`.
- Salvar arquivos em UTF-8 — Sankhya exige ISO-8859-1.
- Improvisar convenções de Spring Boot, Quarkus, Micronaut, etc. — siga as skills do plugin.
- Em `<treeTable>`, raiz com `CODIGOPAI = NULL` ou `GRAU = 0` — convenção Sankhya é sentinela `CODIGOPAI = -999999999` e `GRAU = 1`.

**Delegação obrigatória aos sub-agents** (Claude Code only) — trigger é a natureza do artefato, não o formato do pedido:

- Tabela/entidade (trio CRUD: XML + dbscript + `@JapeEntity`) → `entity-architect`
- `dbscripts/` isolado (ALTER, seed, índice) → `dbscript-builder`
- Endpoint REST (`@Controller` + DTOs + mapper) → `controller-designer`
- Testes JUnit + Mockito → `test-writer`
- Erro / stacktrace / build falhando → `troubleshooter`
- Revisão pré-commit → `addon-reviewer`

Em caso de conflito entre regra do projeto e skill, **prevalece a skill**, exceto se o `CLAUDE.md`/`AGENTS.md` da raiz declarar override explícito.
