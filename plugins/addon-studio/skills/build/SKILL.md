---
name: build
description: Build e deploy local de addon Sankhya via `gradle clean deployAddon` ou `./gradlew clean deployAddon`. Use ao rodar build, fazer troubleshooting de deploy, ou editar `build.gradle`/`gradlew`.
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


## Related Skills

- `encoding` — build pode quebrar se arquivos não estiverem em ISO-8859-1
- `addon-studio` — regras universais Java 8 + Lombok que o build espera
