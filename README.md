# Addon Studio

[![release](https://img.shields.io/github/v/release/snk-devcenter/addon-studio?label=release&color=blue)](https://github.com/snk-devcenter/addon-studio/releases/latest)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Plugin para desenvolver addons **Sankhya Addon Studio 2.0** com **Claude Code** ou **Codex CLI**.

São 24 skills e 6 agents especializados em WildFly/EJB, Java 8 e SDK JAPE. As instruções foram validadas contra os jars reais do SDK (`studio-annotations` e `sdk-sankhya`) para evitar APIs inventadas, JPA no lugar de JAPE, SQL incompatível ou código fora do padrão da plataforma.

## Navegação

- [Instalação](#instalação)
- [Primeiros passos](#primeiros-passos)
- [Como usar](#como-usar)
- [Skills](#skills)
- [Agents](#agents)
- [Regras do Addon Studio](#regras-do-addon-studio)
- [Atualização](#atualização)
- [Contribuição](#contribuição)

## Instalação

Os instaladores configuram o marketplace, instalam ou atualizam o plugin e deixam os agents disponíveis no escopo do usuário. Eles não instalam agents dentro do projeto.

Pré-requisito: tenha o `claude` ou o `codex` instalado e disponível no `PATH`.

### Claude Code

#### Linux e macOS

```sh
curl -fsSL https://github.com/snk-devcenter/addon-studio/releases/latest/download/addon-studio-install.sh | sh -s -- --claude
```

#### Windows PowerShell

```powershell
& ([scriptblock]::Create((Invoke-RestMethod -Uri 'https://github.com/snk-devcenter/addon-studio/releases/latest/download/addon-studio-install.ps1'))) -Claude
```

O instalador registra o marketplace `snk-devcenter` e instala `addon-studio@snk-devcenter` no escopo do usuário. Skills, agents e hooks são carregados pelo próprio plugin.

<details>
<summary>Instalação manual pelo Claude Code</summary>

```text
/plugin marketplace add snk-devcenter/addon-studio
/plugin install addon-studio@snk-devcenter
```

</details>

### Codex CLI

#### Linux e macOS

```sh
curl -fsSL https://github.com/snk-devcenter/addon-studio/releases/latest/download/addon-studio-install.sh | sh -s -- --codex
```

#### Windows PowerShell

```powershell
& ([scriptblock]::Create((Invoke-RestMethod -Uri 'https://github.com/snk-devcenter/addon-studio/releases/latest/download/addon-studio-install.ps1'))) -Codex
```

O instalador registra o marketplace, instala `addon-studio@snk-devcenter` e copia os seis agents para o escopo pessoal do Codex:

- Linux e macOS: `~/.codex/agents/`
- Windows: `$HOME\.codex\agents\`
- Com `CODEX_HOME`: `$CODEX_HOME/agents/`

Agents já personalizados são preservados. Use `--force` no Linux/macOS ou `-Force` no PowerShell somente quando quiser substituí-los pela versão da release.

## Primeiros passos

Abra uma nova sessão da CLI depois da instalação.

### Claude Code

Na raiz de um projeto Addon Studio existente, execute:

```text
/addon-studio:init
```

O comando valida o `build.gradle`, copia as regras permanentes para `docs/ADDON.md` e garante o import `@docs/ADDON.md` no `CLAUDE.md`. A operação é idempotente e preserva as customizações do projeto.

Depois, trabalhe normalmente:

```text
Crie a entidade, o dbscript e o dicionário para a tabela TDCXYZCAB.
```

### Codex CLI

As skills ficam disponíveis automaticamente após a instalação. Você pode descrevê-las em linguagem natural ou invocá-las pelo nome com `$`:

```text
$addon-studio:entity crie a entidade da tabela TDCXYZCAB
```

Para usar um especialista, peça pelo nome:

```text
Use o entity-architect para modelar o CRUD completo desta tabela.
```

Os agents permanecem no diretório pessoal do Codex; nenhum TOML é copiado para o projeto.

## Como usar

### Linguagem natural

As skills são selecionadas pelo contexto do pedido. Exemplos:

| Pedido | Skills principais |
|---|---|
| “Crie entidade, migration e tela cadastral para esta tabela” | `entity`, `database`, `data-dictionary` |
| “Exponha este cadastro por REST com DTO e validação” | `controller`, `mapstruct`, `controller-advice` |
| “Consuma esta API externa com autenticação” | `retrofit`, `dependency-injection` |
| “Execute este processamento toda madrugada” | `job` |
| “Preencha este campo quando o registro for salvo” | `listener` |
| “Crie uma tela HTML5 que chama o endpoint do addon” | `sankhya-js` |
| “Escreva testes para este service” | `test` |
| “Diagnostique este erro de deploy ou Guice” | `build`, `dependency-injection` |

### Invocação explícita

No Claude Code, use `/`:

```text
/addon-studio:controller
/addon-studio:repository
/addon-studio:test
```

No Codex CLI, use `$`:

```text
$addon-studio:controller
$addon-studio:repository
$addon-studio:test
```

## Skills

### Fundamentos e projeto

| Skill | Responsabilidade |
|---|---|
| `addon-studio` | Regras universais, fluxo de feature e convenções do SDK JAPE |
| `init` | Prepara `docs/ADDON.md` e `CLAUDE.md` para uso com Claude Code |
| `build` | Build e deploy local com Gradle |
| `encoding` | Auditoria e conversão de fontes para ISO-8859-1 |

### Dados e persistência

| Skill | Responsabilidade |
|---|---|
| `entity` | Entidades `@JapeEntity`, chaves e relacionamentos |
| `repository` | `JapeRepository`, critérios, queries nativas e paginação |
| `database` | Dbscripts versionados para Oracle e SQL Server |
| `data-dictionary` | Telas cadastrais geradas pelo dicionário de dados |
| `macros` | SQL portável com `MacroTranslator` |

### Backend e integrações

| Skill | Responsabilidade |
|---|---|
| `controller` | Endpoints REST, DTOs, validação e transações |
| `controller-advice` | Tratamento global de exceções e respostas HTTP |
| `mapstruct` | Conversão entre DTOs e entidades |
| `dependency-injection` | Wiring Guice, módulos, providers e escopos |
| `retrofit` | Clientes HTTP com Retrofit, Moshi e OkHttp |
| `type-adapter` | Serialização JSON global de tipos |
| `value` | Parâmetros Sankhya, `@Value` e feature flags |
| `sankhya-utils` | Utilitários nativos de `com.sankhya.util` |

### Eventos e automação

| Skill | Responsabilidade |
|---|---|
| `action-button` | Botões de ação com `AcaoRotinaJava` |
| `business-rule` | Regras do barramento comercial |
| `listener` | Eventos CRUD de persistência |
| `before-load-listener` | Filtros transversais antes de consultas JAPE |
| `job` | Processamentos agendados com CRON |

### Frontend e qualidade

| Skill | Responsabilidade |
|---|---|
| `sankhya-js` | Telas HTML5 em AngularJS sobre `sankhya-js` |
| `jsp` | Telas `.jsp` do add-on com a taglib `sankhyaUtil` |
| `test` | Testes JUnit 5 e Mockito para addons |

## Agents

Os seis agents cobrem tarefas maiores que atravessam várias skills.

| Agent | Quando usar |
|---|---|
| `addon-reviewer` | Revisão pré-commit de compatibilidade, encoding e padrões do plugin |
| `entity-architect` | Modelagem conjunta de entidade, dbscript e dicionário |
| `controller-designer` | Endpoint completo com DTOs, mapper e tratamento de erros |
| `test-writer` | Suíte de testes ou cobertura de vários arquivos |
| `troubleshooter` | Diagnóstico de causa-raiz ainda incerta |
| `dbscript-builder` | Migration isolada para Oracle e SQL Server |

No Claude Code, os agents fazem parte do plugin e aparecem em `/agents`. No Codex, o instalador usa os TOMLs da mesma release e os coloca em `~/.codex/agents/`; peça a delegação explicitamente pelo nome.

## Regras do Addon Studio

O plugin mantém estas restrições em todas as implementações:

- Java 8 estrito.
- JAPE SDK em vez de JPA genérico.
- Lombok, Guice e MapStruct conforme os padrões do Addon Studio.
- Fontes Java, XML, Kotlin e properties em ISO-8859-1.
- Dbscripts compatíveis com Oracle e SQL Server.
- Nomenclatura parametrizada pelo prefixo e módulo do projeto.
- Arquitetura de pacotes e camadas definida pelo projeto, não pelo plugin.

### Convenção de nomenclatura

O plugin detecta o padrão existente. Quando não houver referência suficiente, pergunta o prefixo (`<PRX>`) e o código do módulo (`<MOD3>`) antes de gerar artefatos.

| Artefato | Padrão | Exemplo |
|---|---|---|
| Tabela do addon | `<PRX><MOD3><CTX>` | `TDCXYZCAB` |
| Nome da entidade JAPE | `<Prx><Mod><Ctx>` | `TdcXyzCabecalho` |
| Coluna em tabela nativa | `<MOD3>_NOMECAMPO` | `XYZ_STATUS` |

### Proteção de encoding

O hook de pós-edição converte `.java`, `.xml`, `.kt` e `.properties` para ISO-8859-1. Se o conteúdo já tiver sido corrompido na leitura, o hook interrompe a conversão e pede a restauração do trecho para evitar perda silenciosa.

## Atualização

Execute novamente o instalador do seu provider e sistema operacional. Ele atualiza o marketplace, o plugin e, no Codex, os agents pessoais.

No Claude Code, também é possível atualizar manualmente:

```text
/plugin update addon-studio@snk-devcenter
```

Após atualizar no Claude Code, execute `/addon-studio:init` em cada projeto que precise receber a versão nova de `docs/ADDON.md`.

No Codex, customizações locais dos TOMLs continuam preservadas. Use `--force` ou `-Force` apenas para substituí-las.

## Estrutura do repositório

```text
.
├── .claude-plugin/marketplace.json
├── plugins/addon-studio/
│   ├── .claude-plugin/plugin.json
│   ├── agents/
│   │   ├── *.md               # agents do Claude Code
│   │   └── codex/*.toml       # agents do Codex
│   ├── hooks/
│   └── skills/                # compartilhadas pelos dois providers
└── scripts/                   # instalação e artefatos de release
```

O repositório funciona como marketplace e como fonte do plugin para os dois providers. Novos plugins podem ser adicionados em `plugins/<nome>/`.

## Contribuição

As regras de contribuição e release estão em [CLAUDE.md](CLAUDE.md). Em resumo:

- Crie a branch a partir de `main` usando `feat/`, `fix/` ou `docs/`.
- Use Conventional Commits.
- Registre a mudança em `[Não publicado]` no [CHANGELOG.md](CHANGELOG.md).
- Não altere a versão em PRs; o bump acontece no corte da release.

O projeto usa [SemVer](https://semver.org/lang/pt-BR/). Consulte o histórico no [changelog](CHANGELOG.md) e os artefatos nas [releases](https://github.com/snk-devcenter/addon-studio/releases).

## Licença

[MIT](LICENSE) — Copyright (c) 2026 DevCenter Squad.
