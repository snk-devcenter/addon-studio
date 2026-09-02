---
name: build
description: Build e deploy local de addon Sankhya via `gradle clean deployAddon` ou `./gradlew clean deployAddon` — fixa qual das duas formas usar, o que conferir antes do primeiro deploy e como ler a saída. Use ao rodar build, ao perguntar de onde vem um projeto de addon novo, ao fazer troubleshooting de deploy, quando o servidor local continua respondendo com a versão antiga do addon, ao diagnosticar `BUILD FAILED`, revisar/auditar configuração Gradle, editar `build.gradle`/`build.gradle.kts`/`gradlew`/`settings.gradle`, ou ao precisar de comandos de empacotamento e instalação do addon. Sinaliza projeto Addon Studio quando `build.gradle` ou `build.gradle.kts` aplica o plugin Gradle `br.com.sankhya.addonstudio`. Responde também de onde vem um projeto novo: o esqueleto do addon é gerado pelo tooling Sankhya, não por este plugin nem por skill nenhuma — daqui para frente (`build.gradle` já existente) é escopo desta skill. NÃO usar quando a falha do build tem causa conhecida em outro domínio — charset é `encoding`, binding Guice é `dependency-injection`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Build e Deploy de Desenvolvimento

## Compilar e Fazer Deploy Local

Compilar projeto e verificar deploy dev, execute:

```bash
gradle clean deployAddon
```

> Sem Gradle local, usar wrapper projeto:
>
> ```bash
> ./gradlew clean deployAddon
> ```

Comando compila addon e faz deploy auto no Wildfly local dev.


## Skills relacionadas

- `encoding` — build pode quebrar se arquivos não estiverem em ISO-8859-1; rodar `iconv` após cada `Write`/`Edit` antes de empacotar
