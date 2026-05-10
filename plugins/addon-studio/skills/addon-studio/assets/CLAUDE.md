# CLAUDE.md / AGENTS.md — Template para projeto Sankhya Addon Studio

> **Como usar:** copie este arquivo para a raiz do seu projeto Sankhya como `CLAUDE.md` (Claude Code) ou `AGENTS.md` (OpenAI Codex CLI). Para suportar os dois harnesses, mantenha um arquivo e crie o outro como symlink: `ln -s CLAUDE.md AGENTS.md`.
>
> O template instrui o agente a usar o plugin `addon-studio` como fonte de verdade do projeto, evitando improvisos com convenções de outros stacks (Spring Boot, Quarkus, JPA padrão, etc.).

---

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

Em caso de conflito entre regra do projeto e skill, **prevalece a skill**, exceto se este `CLAUDE.md` declarar override explícito.

---

## Customizações deste projeto

> Adicione aqui regras específicas do seu projeto que devam sobrescrever as skills do plugin (ex.: convenção de pacotes, padrão de nomenclatura customizada, restrições de design adicionais).

- _Sem customizações declaradas._
