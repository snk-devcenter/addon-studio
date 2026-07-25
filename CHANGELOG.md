# Changelog

Todas as mudanças relevantes deste repositório são registradas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

Toda PR adiciona sua entrada em **[Não publicado]**. A versão só é atribuída no corte da release — ver `CLAUDE.md`.

Tipos de entrada: `Adicionado`, `Alterado`, `Corrigido`, `Removido`, `Depreciado`, `Segurança`.

## [Não publicado]

### Adicionado

- `CHANGELOG.md` e `CLAUDE.md` na raiz: fluxo de contribuição, política de versionamento e checklist de corte de release.
- Licença MIT: arquivo `LICENSE`, badge e seção no `README.md`.
- `ADDON.md`: regra always-on de que a skill é fonte de verdade da API e nunca da arquitetura — pacotes, camadas e design seguem o que já existe no projeto; sem precedente, o agente pergunta.

### Alterado

- `plugin.json`: `license` de `UNLICENSED` para `MIT`.
- Skill `controller`: seção nova fixa a entidade `@JapeEntity` como o objeto que atravessa controller → service; modelo de domínio separado da entidade vira decisão explícita do projeto, não default de CRUD.
- Skills `controller` e `mapstruct`: exemplos nomeiam a entidade no lugar de `MeuDomain`/`MeuDomainObj` — tipos que a skill nunca definia e que o agente lia como terceiro modelo.
- Skill `controller`: convenção de service passa a ser `<Feature>Service` com métodos nomeados (`PedidoService.criar`), em vez de uma classe por endpoint com `execute()` único.
- Skill `dependency-injection`: interface só quando há polimorfismo real — implementação única injeta a classe concreta.
- `README.md`: badge de release passa a ser dinâmica (lê a última release), texto restaurado com acentuação, seção "Contribuindo" apontando para o fluxo de PR.

### Corrigido

- Skills `retrofit` e `action-button`: exemplos declaravam `package` do projeto consumidor (`...infrastructure.integration.*`), fazendo o agente inferir Clean Architecture como layout padrão do addon.
- Skill `dependency-injection`: interface Guice descrita como "Port", vocabulário de arquitetura hexagonal em texto neutro.
- Skill `mapstruct`: exemplo de injeção resolvia a chamada dentro do controller (`// ... logica ...`), contradizendo a regra de controller sem regra de negócio.
- `README.md`: sub-agent `troubleshooter` estava documentado como `haiku` — o agent declara `model: sonnet`.
- `README.md`: descrição do hook de encoding não mencionava o abort em `U+FFFD` (comportamento desde a 2.15.0); skill `encoding` também cobre `.properties`.

## [2.17.0] - 2026-07-25

- Skill `sankhya-js`: telas HTML5 do módulo `-vc` (AngularJS 1.x).

## [2.16.0] - 2026-07-25

- Skill `sankhya-utils`: utilitários `com.sankhya.util`.

## [2.15.0] - 2026-07-24

- Hook de encoding aborta quando o acento já foi destruído (U+FFFD) em vez de mascarar a perda.

## [2.14.0] - 2026-07-20

- Enum `Transactional.TxType` documentado nas skills `controller` e `job`.

## [2.13.1] - 2026-07-14

- Tipo decimal mapeado como `FLOAT`, alinhado às tabelas nativas.

## [2.13.0] - 2026-07-14

- Skill `database` gera `CHECK` constraints para campos `LISTA`/`CHECKBOX`.

## [2.12.1] - 2026-07-14

- Itens do `metadados.xsd` que estavam omitidos na skill `data-dictionary`.

## [2.12.0] - 2026-07-04

- Skill `listener`: `@Listener`/`PersistenceEventAdapter`, eventos CRUD de persistência + DI Guice.

## [2.11.1] - 2026-07-04

- Review completo: APIs validadas contra os jars, roteamento de skills/agents, hook de encoding.

## [2.11.0] - 2026-07-04

- Guice/`BindingAlreadySet` (máximo um `@Component` por interface); skill `value` — `Provider<T>` congela após o primeiro `get()`, feature flag togglável via `MGECoreParameter` + `parameter.xml`.

## [2.10.0] - 2026-06-16

- Regra always-on "API do SDK = skill, não jar"; versão do SDK removida da documentação.

## [2.9.1] - 2026-06-12

- Assinaturas das skills corrigidas contra os jars do SDK.

## [2.9.0] - 2026-06-02

- Roteamento de skills via `description`; `ADDON.md` enxuto (só regras always-on).

## [2.8.0] - 2026-06-01

- Skill `before-load-listener`: `@BeforeLoadListener`/`FinderListener`.

## [2.7.0] - 2026-05-29

- Skill `init` cria `docs/ADDON.md` em vez da raiz; skill `retrofit` (integração HTTP externa).

## [2.6.0] - 2026-05-25

- Skill `retrofit`: Retrofit + Moshi + OkHttp.

## [2.5.0] - 2026-05-20

- Skill `/addon-studio:init`: `ADDON.md` + `@import` no `CLAUDE.md` do projeto consumidor.

## [2.4.3] - 2026-05-12

- Acentos permitidos em `<description>` e `UITabName`.

## [2.4.2] - 2026-05-12

- `<description>` própria passa a ser exigida em `<table>`.

## [2.4.1] - 2026-05-12

- Tipo Oracle do checkbox como `VARCHAR2(1)`.

## [2.4.0] - 2026-05-10

- `ResultSetMethods`, `ParamMatrix` e delegação proativa de sub-agents.

## [2.3.2] - 2026-05-10

- Sintaxe `@Parameter(name = ...)`; clarificação de campos opcionais/obrigatórios.

## [2.3.1] - 2026-05-09

- Template `CLAUDE.md` descobrível via `assets/` da skill.

## [2.3.0] - 2026-05-09

- Triggers de audit/refactor, fingerprint do SDK, cross-skill discovery e sentinela de `treeTable`.

## [2.2.1] - 2026-05-09

- Reforço de `CODIGOPAI` como nome fixo do framework.

## [2.2.0] - 2026-05-09

- Cobertura do schema `metadados.xsd` + cleanup.

## [2.1.0] - 2026-05-09

- 6 sub-agents especialistas.

## [2.0.0] - 2026-05-09

- Reestruturação multi-skill seguindo a spec de Agent Skills.

## [1.6.4] - 2026-05-07

- Campo `repository` do `plugin.json` como string.

## [1.6.3] - 2026-05-07

- Convenção de nomenclatura parametrizada por projeto (`<PRX><MOD3><CTX>`).

## [1.6.2] - 2026-05-07

- `source` do `marketplace.json` corrigido para `git-subdir`.

## [1.6.1] - 2026-05-06

- `description` do `SKILL.md` reduzida para <= 1024 caracteres.

## [1.6.0] - 2026-05-06

- Layout multi-plugin (`plugins/<nome>/`).

## [1.5.0] - 2026-05-06

- Instalação documentada para repositório privado.

## [1.4.0] - 2026-05-05

- Ajustes de conteúdo das instructions.

## [1.3.0] - 2026-05-02

- 7 novas instructions + fixes.

## [1.2.0] - 2026-04-30

- Hook `PostToolUse` de encoding ISO-8859-1 via plugin.

## [1.1.0] - 2026-04-30

- Regra de encoding ISO-8859-1 para `.java`, `.xml` e `.kt`.

## [1.0.0] - 2026-04-29

- Versão inicial do plugin `addon-studio`.

[Não publicado]: https://github.com/snk-devcenter/addon-studio/compare/v2.17.0...HEAD
[2.17.0]: https://github.com/snk-devcenter/addon-studio/releases/tag/v2.17.0
