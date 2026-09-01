# Changelog

Todas as mudanças relevantes deste repositório são registradas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

Toda PR adiciona sua entrada em **[Não publicado]**. A versão só é atribuída no corte da release — ver `CLAUDE.md`.

Tipos de entrada: `Adicionado`, `Alterado`, `Corrigido`, `Removido`, `Depreciado`, `Segurança`.

## [Não publicado]

## [2.22.0] - 2026-09-01

### Adicionado

- Skill `jsp` cobre telas `.jsp` do add-on de ponta a ponta: instalação da taglib `sankhyaUtil` (TLD, `QueryTag`, `HTMLGadgetSetupTag`), registro no menu, carga de dados por `<snk:query>` ou `executeQuery`, navegação com `openApp`/`openLevel` e templates prontos para copiar — incluindo o que muda ao portar um gadget do Dashboard nativo.
- Esteira de auditoria de disparo cobre catálogo com número ímpar de skills: com 25, três skills ficavam sem um dos três eixos e a fórmula de lotes as deixava de fora do teste.

### Alterado

- Skill `sankhya-js` declara que painel/dashboard denso de leitura e tela `.jsp` pertencem à skill `jsp`, desambiguando o roteamento entre as duas.

## [2.21.1] - 2026-08-19

### Alterado

- README reorganizado com instalação, primeiros passos, uso e atualização separados para Claude Code e Codex CLI, além do catálogo de skills agrupado por domínio.

### Corrigido

- Skill `init` cria o `CLAUDE.md` só com o import `@docs/ADDON.md`, sem seção de customizações com placeholder — a seção vazia induzia o agente a preencher regras já documentadas no projeto.
- Releases incluem instaladores `sh` e PowerShell com `--claude`/`--codex` para configurar o provider inteiro sem copiar TOMLs à mão nem alterar o projeto; customização local só é substituída com `--force`/`-Force`.

## [2.21.0] - 2026-08-18

### Adicionado

- Permite instalar manualmente no Codex CLI os seis especialistas, com roteamento e permissões equivalentes documentados.

## [2.20.0] - 2026-07-31

### Adicionado

- Hook `SessionStart` injeta as regras sempre-ativas (Java 8, ISO-8859-1, JAPE, Guice) em projeto que ainda não rodou `/addon-studio:init` — sem isso, skill focada dispara mas o código sai fora da regra. Silencioso fora de projeto Addon Studio.
- Esteira `tools/skill-trigger-audit`: mede se cada skill dispara sem âncora no projeto, com 3 cenários por skill (óbvio, indireto, negativo) e histórico de runs comparáveis.

### Alterado

- 20 skills ganham gatilho em linguagem de dev, não só nome de símbolo: `test` (regressão, travar comportamento antes de refatorar), `job` ("de madrugada", "sem intervenção", lote), `dependency-injection` (texto do erro de binding, costura entre camadas), `value` ("liga-desliga", "sem redeploy"), `database` (`ALTER TABLE`, índice, seed), `macros` (`NVL`, `SYSDATE`, `TRUNC`), `encoding` (acento embaralhado, caractere inválido), `data-dictionary` ("virar tela de cadastro", campo obrigatório, menu), `action-button` (marcar registros na grade e clicar), `before-load-listener` (empresa do usuário logado, sem depender de quem chama), `build` (servidor local com versão antiga), entre outras.
- Pares que competiam agora se excluem por nome na própria `description`: `listener` ↔ `business-rule`, `mapstruct` ↔ `type-adapter`, `data-dictionary` ↔ `sankhya-js`, `sankhya-utils` ↔ `sankhya-js`, `action-button` ↔ `job`/`sankhya-js`, `repository` ↔ `controller`, `controller` ↔ `retrofit`.
- `controller` assume a pergunta "como invoco esse endpoint" (URL `serviceName`/SP, Postman, curl), que antes não tinha dono.
- `data-dictionary` e `sankhya-js` abrem com o critério de decisão em vez do inventário de tags/componentes, e cada uma declara um sinal observável: tela sem pasta em `webapp/html5/` é do dicionário; tela que chama endpoint do addon é HTML5. `data-dictionary` é o dono default de label/texto de tela quando o dev não cita o caminho.
- `addon-studio` responde de entrada que o esqueleto do projeto vem do tooling Sankhya — nenhuma skill cria `build.gradle` do zero — e oferece `/addon-studio:init` em projeto sem `docs/ADDON.md`.
- `listener`, `controller`, `database` e `data-dictionary` passam a declarar cada um o seu recorte de "campo obrigatório": campo da tabela em qualquer origem de gravação, payload do endpoint, `NOT NULL` da coluna e obrigatório na tela.
- `ADDON.md` do `init` enxuga de 29 para 20 linhas: sai a seção de roteamento (as `description` roteiam sozinhas) e a tabela de delegação a sub-agents (duplicava a `description` deles); ficam só as regras sempre-ativas, que nenhuma `description` consegue carregar.
- `MUST BE USED` dos sub-agents deixa de capturar pedido de artefato único: `troubleshooter` sai de erro com causa conhecida, `test-writer` de teste de um arquivo, `entity-architect` e `dbscript-builder` param de disputar o mesmo pedido, `controller-designer` devolve `@ControllerAdvice` isolado para a skill.

### Corrigido

- `init` deixa de atrair "cria o projeto do zero" e de colidir com o `/init` embutido do Claude Code; `build` idem para esqueleto de projeto.
- `entity` avisa que renomear/adicionar coluna em entidade publicada arrasta `dbscripts/` e `datadictionary/`.

## [2.19.0] - 2026-07-27

### Adicionado

- Skill `sankhya-js` ganha `references/ui-components.md`: catálogo dos componentes genéricos que faltavam — overlay e feedback (`WaitWindow`, `SnackbarService`/`sk-snackbar`, `sk-popover`, `sk-help-tip`, `TooltipBuilder`, `sk-dropdown`), layout (`sk-scroll-container`, `sk-accordion`, `sk-divider`, `sk-loading-panel`, `sk-work-box`), listas (`sk-list`, `sk-entity-card`, `sk-btn-novo`) e comportamento (`sk-draggable`, `sk-resizable`, `sk-sortable`).
- Skill `sankhya-js`: 10 armadilhas dos componentes de UI — `WaitWindow` é singleton e sem `close()` no `finally` trava a tela, `SnackbarService` monta os atributos com aspas simples (apóstrofo na mensagem quebra a expressão), `sk-entity-card` e `sk-resizable` usam binding `=` onde parece `@` (`sk-entity-name="'Parceiro'"`), `sk-scroll-container` não cria área rolável, tooltip `scrollable` exige `placement: 'bottom'` e o evento dos handlers do `sk-list` é jqLite (`event.originalEvent.dataTransfer`).
- Skill `sankhya-js` documenta os componentes de apoio da grade: `sk-rows-counter` (contador ligado ao dataset, com o pop de cancelar paginação em background), `sk-grid-config` (colunas visíveis, atrás da autorização `ACCESS_CONTROL_CONFIG_GRID`) e `GridStatistics.openGridStatistics(datagrid)` (soma, média, maior e menor das colunas numéricas visíveis).
- Skill `sankhya-js` documenta i18n no template: os filtros `| i18n` (framework) e `| translate` (angular-translate) e as diretivas `sk-i18n` — que traduz conteúdo, `tooltip`, `title`, `placeholder` e qualquer atributo prefixado com `@i18n:` — e `sk-translate`, com `sk-translate-exp`, `sk-translate-attr`, `sk-translate-values` e `sk-remove-end-colon`.
- Skill `sankhya-js`: chave i18n inexistente não lança — o `$translate` devolve a própria chave, então o sintoma é a tela exibindo `Modulo.lblAlgumaCoisa`.
- Skill `sankhya-js` ganha `references/utils.md`: assinaturas dos utilitários do módulo `snk.core.util` que a tela injeta direto — `StringUtils`, `NumberUtils`, `DateUtils` + `DateUtilsConstants`, `ArrayUtils`, `ObjectUtils`, `SkConstants` (`KEY_CODE`, eventos, operadores SQL), `Base64`, `UrlUtils`, `SqlUtils`, `SessionFileUpload`, `ClipboardUtils`, `UidGenerator` e `AngularUtil`. Antes eram menções de passagem sem contrato, então o agente reescrevia null-check, formatação de data e cláusula `IN` na mão.
- Skill `sankhya-js`: 10 armadilhas dos utilitários — `StringUtils.toBoolean` só aceita `'true'`/`'s'`, `ArrayUtils.findWhere` sempre devolve `undefined` (itera a própria variável no `for...in`), `ObjectUtils.clone` é raso e devolve string para `Date`, `Base64.encode(x)` não aplica UTF-8 (a segunda definição sobrescreve a primeira), `AngularUtil.timeout` não dispara digest, `SqlUtils.buildINClause` devolve a cláusula sem o primeiro campo e `DateUtils.getToday()` zera a hora.
- Skill `sankhya-js` documenta os ~30 inputs da família `FieldBinder`, não só os 5 anteriores: índice de qual componente usar por tipo de dado e uma seção por input com os atributos próprios — `sk-text-area`, `sk-masked-input`, `sk-url-input`, `sk-rich-text`, `sk-code-editor`, `sk-number-input`, `sk-numeric-stepper`, `sk-rate-input`, `sk-date-input`, `sk-time-input`, `sk-date-period-input`, `sk-datepicker`, `sk-multi-combo`, `sk-radio-input`, `sk-checkbox-list`, `sk-select-distinct-input`, `sk-typeahead-input`, `sk-cgc-cpf-input`, `sk-cep-input`, `sk-phone-input`, `sk-file-input`, `sk-file-input-multi`, `sk-image-input`, `sk-color-picker` e `sk-search-input`.
- Skill `sankhya-js`: `sk-file-input` grava no campo a chave de sessão `$file.session.key{<fileKey>}` — o binário é resolvido no backend, e `sk-name-as-value` troca isso pelo nome do arquivo.
- Skill `sankhya-js`: 11 armadilhas novas dos inputs — `sk-focus-out` é `&` em uns componentes e `=` em outros, `sk-radio-input` chama um `onFocusOut` que não existe no scope (`TypeError` no blur) e foca o `<label>`, `sk-align` é inerte no `sk-date-input` (chave duplicada no template), `sk-rate-input` não tem `sk-enabled`, `sk-multi-combo`/`sk-checkbox-list` mutam os arrays recebidos, `sk-precision` default `0` não formata decimais, `NumberUtils.stringToNumber('1.234')` devolve `1.234` e `sk-search-input` sinaliza o filtro limpo por `sk-cancel-search`, não por `sk-change`.
- Skill `sankhya-js` documenta `PopUpParameter` — popup de formulário sem `.tpl.html`/`.controller.js` nem registro no `launcher/<Tela>.body`: os builders por tipo de campo, `openPopUp` para campos vindos do backend, o `.show().result` (a instância não é thenable) e a tabela de decisão contra `MessageUtils`, `SanPopup.open` e `sk-form`.
- Skill `sankhya-js`: armadilhas do `PopUpParameter` — campo obrigatório vazio lança exceção em vez de rejeitar a promise, `showBtnDesconsiderar` resolve com valores sentinela (`-9999`, `'01/01/1800'`, `'>:-:<'`) que não devem chegar ao backend, o bind do Enter nunca é desfeito e `.options({...})` substitui o objeto inteiro de opções.

### Corrigido

- Skill `sankhya-js`: o exemplo de "use o util do framework" em `code-quality.md` chamava `DateUtil.format(d, 'dd/MM/yyyy')` — serviço inexistente e formato inválido em moment (`dd` é dia da semana, `yyyy` não é token). Agora é `DateUtils.formatDate(d, DateUtilsConstants.DEFAULT_DATE_FORMAT)`.
- Skill `sankhya-js`: o gotcha de `current-step` do `sk-wizard` dizia que a busca por título "só funciona" em certo caso — o `ArrayUtils.findWhere` por trás nunca acha nada, então o atributo não navega em cenário nenhum; a saída é `SkWizardHandler.wizard('nome').goTo(...)`.

## [2.18.2] - 2026-07-27

### Adicionado

- Skill `sankhya-js` documenta `dynaform.getNavigatorAPI()` — único caminho para esconder botão CRUD de tela de dynaform, já que o `sk-navigator` é interno ao template e nem `sk-dynaform` nem `<dynamicForm>` têm atributo para isso: as chaves de `navigatorOptions` com defaults, o encadeamento getter/setter e a distinção de `dynaform.navigatorApi` (o `SkNavigatorController` do `sk-api`).
- Skill `sankhya-js`: armadilhas do navigator do dynaform — a barra fixa (`sk-fixed-bar`) não recebe remove/refresh/cancel/save, e os `sk-show-*` são `AND` com o `toolBarManager` do Helper de backend (exceto `showAddButton`/`showEditButton`), então a API só esconde e nunca força aparecer.
- Skill `sankhya-js` documenta `sk-taskbar` + `sk-navigator-options` como toolbar sobre dataset sem dynaform.
- Skill `sankhya-js`: `ObjectUtils.isImplementorOf` lança quando o objeto não declara todos os métodos da interface como own property — vale para as 12 interfaces do framework, com a saída via `ObjectUtils.implements`.

### Corrigido

- Skill `sankhya-js` marca `interceptNavigator`, `interceptDynaform` e `interceptPersonalizedFilter` do `IDynaformInterceptor` como código morto — declarados na interface, nunca chamados; dos 7 métodos, só 4 rodam.
- Skill `sankhya-js` corrige o escopo de `show-crud="false"` no `sk-navigator`: também esconde salvar/descartar/atualizar e **não** esconde a navegação.
- Skill `sankhya-js` deixa de orientar interceptor com "pelo menos os métodos que pretende usar" — implementação parcial derruba a tela no init.
- Skill `sankhya-js` corrige a guarda do `Ctrl+F` do `sk-navigator`: `isInsideDynaform` nunca é atribuído; quem controla é `sk-enable-search-fields`.

## [2.18.1] - 2026-07-26

### Corrigido

- Skill `data-dictionary`: PK automática (`sequenceType="A"`) passa a ser o default explícito para tabela nova do addon — config, log, registro e tabela de apoio incluídos. `"M"` fica restrito a PK composta só de FKs, código de negócio externo ou espelho de chave nativa, com o sintoma nomeado (`ORA-01400` ao gravar pela tela).
- Skill `data-dictionary`: exemplos de `sequenceType="M"` deixam de usar tabela de configuração — era o trecho copiado para tabelas que deveriam ter PK automática; o caso manual agora é tabela de vínculo com PK composta de FKs.
- Skill `database`: seed de dados iniciais deriva a PK de `MAX(<PK>)+1` e testa idempotência pela chave de negócio, em vez de fixar chave literal que disputa a sequência do framework; registro único de configuração não é semeado. DDL da PK sem `IDENTITY`/`CREATE SEQUENCE`.
- Skill `entity`: PK automática documentada como default, com a consequência no código — não setar a PK antes do `save` num insert.
- Sub-agents `entity-architect` e `dbscript-builder`: `sequenceType` deixa de ser pergunta aberta ao dev (assume `"A"`) e PK literal em seed entra nos anti-patterns.
- Sub-agent `addon-reviewer`: PK manual em tabela de config/log/apoio e seed com PK literal passam a ser blockers de revisão.

## [2.18.0] - 2026-07-25

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

[Não publicado]: https://github.com/snk-devcenter/addon-studio/compare/v2.22.0...HEAD
[2.22.0]: https://github.com/snk-devcenter/addon-studio/compare/v2.21.1...v2.22.0
[2.21.1]: https://github.com/snk-devcenter/addon-studio/compare/v2.21.0...v2.21.1
[2.21.0]: https://github.com/snk-devcenter/addon-studio/compare/v2.20.0...v2.21.0
[2.20.0]: https://github.com/snk-devcenter/addon-studio/compare/v2.19.0...v2.20.0
[2.19.0]: https://github.com/snk-devcenter/addon-studio/compare/v2.18.2...v2.19.0
[2.18.2]: https://github.com/snk-devcenter/addon-studio/compare/v2.18.1...v2.18.2
[2.18.1]: https://github.com/snk-devcenter/addon-studio/compare/v2.18.0...v2.18.1
[2.18.0]: https://github.com/snk-devcenter/addon-studio/compare/v2.17.0...v2.18.0
[2.17.0]: https://github.com/snk-devcenter/addon-studio/releases/tag/v2.17.0
