# Addon Studio Plugin

Plugin Claude Code com skill `addon-studio` — orienta implementacao em projetos **Sankhya Addon Studio 2.0** (Wildfly/EJB + SDK Java JAPE). Mantido pelo setor DevCenter.

## Conteudo

```
.
├── .claude-plugin/
│   └── plugin.json                              # manifesto do plugin
└── skills/
    └── addon-studio/
        ├── SKILL.md                             # entrypoint da skill
        └── instructions/
            ├── backend-instructions.md
            ├── build-instructions.md
            ├── controller-instructions.md
            ├── database-instructions.md
            ├── datadictionary-instructions.md
            ├── dependency-injection-instructions.md
            ├── entity-instructions.md
            ├── mapstruct-instructions.md
            ├── repository-instructions.md
            └── test-instructions.md
```

## Cobertura

- `@JapeEntity` — entidades (Lombok, PK simples/composta, relacionamentos)
- Dicionario de dados (XML)
- Scripts de banco (`dbscripts/V<NNN>-*.xml`, dual mssql/oracle)
- Repository (`@Repository`, `@Criteria`, `@NativeQuery`, `@Modifying`)
- Controller REST (`@Controller(serviceName SP)`, DTO + `@Valid`, `@ControllerAdvice`)
- Injecao Guice (`@Component`, `@CustomModule`, `Multibinder`, `@Singleton`, `Provider<T>`)
- MapStruct (`componentModel=jakarta`, `injectionStrategy=CONSTRUCTOR`, padrao create/merge)
- Testes (JUnit 5 + Mockito 4.11, mock estatico, JapeRepository quirks)
- Build / deploy (`gradle deployAddon`)

## Convencao do setor DevCenter (camada de persistencia)

| Artefato                              | Padrao                          | Exemplo            |
|:--------------------------------------|:--------------------------------|:-------------------|
| Tabela do addon                       | `TDC<MODULO3><CONTEXTO>` UPPER  | `TDCXYZCAB`        |
| `@JapeEntity(entity = "...")`         | `Tdc<Modulo><Contexto>` Pascal  | `TdcXyzCabecalho`  |
| Coluna custom em tabela nativa        | `<MOD>_NOMECAMPO` UPPER         | `XYZ_STATUS`       |

## Sem opiniao arquitetural

Skill cobre **regras do SDK e do framework**. Organizacao de pacotes, camadas e padroes de design (Clean Arch, Hexagonal, MVC, DDD) sao decisoes do dev/projeto.

## Instalacao

Via marketplace privado do setor — consulte SETUP do repo `devcenter-marketplace`.

## Versionamento

Versoes seguem [SemVer](https://semver.org/lang/pt-BR/). Tag git por release: `v1.0.0`, `v1.1.0`, etc.

## Atualizacao manual (debug)

Em sessao Claude Code:

```
/plugin update addon-studio
```
