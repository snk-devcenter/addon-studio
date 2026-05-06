---
applyTo: "**/{build.gradle,settings.gradle,gradle.properties,gradlew,gradlew.bat}"
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