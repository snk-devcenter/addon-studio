---
name: build
description: Build e deploy local de addon Sankhya via `gradle clean deployAddon` ou `./gradlew clean deployAddon`. Use ao rodar build, fazer troubleshooting de deploy, diagnosticar `BUILD FAILED`, revisar/auditar configuração Gradle, editar `build.gradle`/`build.gradle.kts`/`gradlew`/`settings.gradle`, ou ao precisar de comandos de empacotamento e instalação do addon. Sinaliza projeto Addon Studio quando `build.gradle` ou `build.gradle.kts` aplica o plugin Gradle `br.com.sankhya.addonstudio`.
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
- `addon-studio` — regras universais Java 8 + Lombok que o build espera
