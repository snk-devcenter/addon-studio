---
name: test
description: JUnit 5 + Mockito 4.11 testing for Sankhya Addon Studio (static mock, JapeRepository quirks, fixtures). Use when writing unit tests under `src/test/java/`.
license: Proprietary
compatibility: Sankhya Addon Studio 2.0 (Wildfly/EJB + JAPE SDK). Java 8, Gradle, ISO-8859-1.
---

# Testes Backend - Addon Studio 2.0 (JUnit + Mockito)

Documento define como desenvolver testes automatizados backend Addon Studio 2.0 com libs de mercado.

## Objetivo

- Garantir comportamento regras negocio.
- Permitir refator seguro.
- Reduzir regressao em servicos e mapeamentos.

## Bibliotecas recomendadas

- JUnit 5 (`org.junit.jupiter`)
- Mockito 4.x (`org.mockito`) — **usar 4.11.0. Projeto Java 8. Mockito 5.x exige Java 11+.**
- AssertJ (assercoes fluentes)
- `mockito-inline` (mock estatico `JapeSession`, `SessionFile` etc.)

## O que testar

Foque em logica de negocio isolada — classes de servico, regras em entidades, mapeamentos. Pular o que e framework / SDK.

Regra pratica:
- Testar unidade de negocio isolada.
- Nao testar framework Addon Studio em si.
- Nao acoplar teste unitario a banco real, Wildfly ou infra externa.
- Onde organizar arquivos de teste fica a criterio da arquitetura do projeto (convencao Maven/Gradle: espelhar pacote do `src/main/java` em `src/test/java`).

Padrao nome:
- Classe teste: `<ClasseAlvo>Test`
- Metodo teste: `deve<Resultado>_quando<Condicao>()`

## Configuracao completa (Gradle)

### 1. `build.gradle` raiz — adicionar classpath do plugin de log visual

```groovy
buildscript {
    repositories {
        // ... repositorios existentes ...
        maven {
            url = uri("https://plugins.gradle.org/m2/")
        }
    }

    dependencies {
        // ... dependencias existentes ...
        classpath "com.adarshr:gradle-test-logger-plugin:3.2.0"
    }
}
```

### 2. `<modulo-backend>/build.gradle` — dependencias e configuracao

```groovy
apply plugin: 'com.adarshr.test-logger'

testlogger {
    theme 'mocha'
    showExceptions true
    showStackTraces true
    showFullStackTraces false
    showCauses true
    slowThreshold 2000
    showSummary true
    showPassed true
    showSkipped true
    showFailed true
    showStandardStreams false
    showPassedStandardStreams false
    showFailedStandardStreams true
    logLevel 'lifecycle'
}

dependencies {
    // SDK do Addon Studio no classpath de teste.
    // Obrigatorio: repositorios (ex.: TdcXyzCadastroRepository) estendem JapeRepository
    // do SDK da Sankhya, que so e disponibilizado para compilacao principal pelo
    // plugin Gradle do Studio. Sem isso, o compilador nao resolve findByPK/save nos testes.
    testImplementation 'br.com.sankhya.studio:sdk-sankhya:2+'

    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.10.2'
    testRuntimeOnly    'org.junit.jupiter:junit-jupiter-engine:5.10.2'

    // mockito-core 4.x: compativel com Java 8 (5.x exige Java 11+)
    testImplementation 'org.mockito:mockito-core:4.11.0'
    testImplementation 'org.mockito:mockito-junit-jupiter:4.11.0'

    // mockito-inline: necessario para mockar metodos estaticos (JapeSession, SessionFile etc.)
    testImplementation 'org.mockito:mockito-inline:4.11.0'

    testImplementation 'org.assertj:assertj-core:3.26.3'
}

test {
    useJUnitPlatform()
}
```

Output visual `test-logger` tema `mocha` similar a Jest:

```
com.example.addon.ProcessarEntidadeServiceTest

  ✔ deveProcessar_quandoGatewayRetornarDados()
  ✔ deveLancarEntityNotFoundException_quandoEntidadeNaoEncontrada()
  ✘ deveLancarRuntimeException_quandoRepositorioFalhar()
    ...stack trace...

82 passing (2.9s)
1 failing
```

## Template de teste unitario

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ProcessarEntidadeServiceTest {

    @Mock
    private EntidadeRepository entidadeRepository;

    @Mock
    private EntidadeGateway entidadeGateway;

    @InjectMocks
    private ProcessarEntidadeService service;

    @Test
    void deveProcessarEntidade_quandoGatewayRetornarDados() throws Exception {
        // arrange
        when(entidadeGateway.buscarDados()).thenReturn(Arrays.asList(new EntidadeDominio()));

        // act
        List<EntidadeDominio> resultado = service.execute();

        // assert
        assertThat(resultado).hasSize(1);
        verify(entidadeGateway, times(1)).buscarDados();
    }
}
```

## Metodos JapeRepository lancam `Exception` verificada

`JapeRepository<K, V>` (base de todos os repositorios) declara:

```java
V findByPK(K pk) throws Exception;
V save(V entity) throws Exception;
```

Metodos consulta customizados em interfaces repositorio (ex.: `findByCodParceiro`, `findByIdOrigem`) tambem podem declarar `throws Exception`.

**Regra:** qualquer metodo teste que chame `when(repository.metodo(...))` nesses metodos precisa declarar `throws Exception`:

```java
@Test
void deveLancarEntityNotFoundException_quandoNaoEncontrado() throws Exception {
    when(repository.findByPK(99)).thenReturn(null); // findByPK throws Exception

    assertThrows(EntityNotFoundException.class, () -> service.execute(99));
}
```

## Mocking estatico (JapeSession, SessionFile)

Use `mockito-inline` para mockar metodos estaticos do SDK:

```java
import org.mockito.MockedStatic;
import static org.mockito.Mockito.mockStatic;

@Test
void deveExecutar_quandoSessionPropertyAtiva() throws Exception {
    try (MockedStatic<JapeSession> japeSessionMock = mockStatic(JapeSession.class)) {
        japeSessionMock.when(() -> JapeSession.getPropertyAsBoolean(anyString(), anyBoolean()))
                .thenReturn(false);

        // act e assert
    }
}
```

Use `try-with-resources` pra garantir mock estatico fechado apos teste.

## Armadilha: objetos iguais por Lombok `@Data` conflitam em stubs

Entidades com `@Data` geram `equals`/`hashCode` de todos campos. Dois objetos
criados com `new Entidade()` (campos nulos) sao **iguais** pro Mockito. Segundo
`when(repo.save(obj2))` sobrescreve primeiro `when(repo.save(obj1))`.

**Errado:**
```java
Entidade e1 = new Entidade(); // todos os campos nulos
Entidade e2 = new Entidade(); // idem — e1.equals(e2) == true

when(repository.save(e1)).thenReturn(e1);
when(repository.save(e2)).thenThrow(new RuntimeException()); // sobrescreve o anterior!
```

**Correto — usar `any()` com respostas consecutivas:**
```java
Entidade e1 = new Entidade();
Entidade e2 = new Entidade();

when(repository.save(any()))
        .thenReturn(e1)                              // primeira chamada
        .thenThrow(new RuntimeException("erro"));    // segunda chamada
```

## Armadilha: mensagens de excecao com caracteres acentuados

Fontes projeto usam codificacao que pode gerar caracteres corrompidos (`?`)
nos textos excecao runtime. Evite asserções com acentos em
`assertThat(ex.getMessage()).contains(...)`:

**Fragil (pode falhar por encoding):**
```java
assertThat(ex.getMessage()).contains("número da nota");
assertThat(ex.getMessage()).contains("agrônomo");
assertThat(ex.getMessage()).contains("área tratada");
```

**Robusto — usar substring ASCII que aparece na mensagem:**
```java
assertThat(ex.getMessage()).contains("da nota");
assertThat(ex.getMessage()).contains("agr");
assertThat(ex.getMessage()).contains("tratada");
```

Se mensagem vem de wrapper (ex.: `"Erro ao criar o pedido. Motivo: %s"`),
cheque parte invariante ASCII:

```java
assertThat(ex.getMessage()).contains("Motivo:");
```

## Armadilha: `UnnecessaryStubbingException` em cenarios de erro

`MockitoExtension` usa modo estrito. Stub configurado mas nao chamado no
teste lanca `UnnecessaryStubbingException`.

Ocorre tipicamente quando metodo auxiliar (`helper mock`) adiciona stubs que so
seriam invocados no caminho feliz, mas teste cobre caminho erro onde execucao
para antes.

**Errado — stub de `getDataCancelamento()` nunca chamado quando gateway lanca excecao:**
```java
private Pedido pedidoMock() {
    Pedido mock = mock(Pedido.class);
    when(mock.getDataCancelamento()).thenReturn(new Timestamp(...)); // stub extra
    return mock;
}

@Test
void deveLancarIntegrationException_quandoGatewayFalhar() throws Exception {
    Pedido pedido = pedidoMock(); // stub de getDataCancelamento() nao sera usado
    when(gateway.cancel(pedido)).thenThrow(new IntegrationException("erro"));
    // gateway lanca antes de getDataCancelamento() ser chamado -> UnnecessaryStubbingException
}
```

**Correto — use `mock()` puro quando caminho nao invoca metodos extras:**
```java
@Test
void deveLancarIntegrationException_quandoGatewayFalhar() throws Exception {
    Pedido pedido = mock(Pedido.class); // sem stubs desnecessarios
    when(gateway.cancel(pedido)).thenThrow(new IntegrationException("erro"));

    assertThrows(IntegrationException.class, () -> service.execute(pedido));
}
```

## Boas praticas

- Estrutura AAA: Arrange, Act, Assert.
- Use `@ExtendWith(MockitoExtension.class)` pra inicializar mocks.
- Prefira `@InjectMocks` + construtor da classe alvo.
- Valide comportamento e efeitos observaveis. Evite detalhes internos.
- Um cenario por teste.
- Dado teste simples e explicito.
- Declare `throws Exception` em metodos teste que interajam com repositorios JapeRepository.

## O que evitar

1. Teste com dependencia horario real sem controle.
2. Assert generico (ex.: so `notNull`) quando regra exige validacao forte.
3. Mockar propria classe sob teste.
4. Teste que cobre varios cenarios nao relacionados no mesmo metodo.
5. Banco real em teste unitario.
6. Mockito 5.x em projetos Java 8 — usar 4.11.0.
7. Asserções mensagem com acentos (`ã`, `ç`, `ô`, `ú` etc.).
8. Dois `new Entidade()` identicos como args de stubs distintos.

## Testes de excecao

Quando ha validacao negocio/excecao:

```java
import static org.junit.jupiter.api.Assertions.assertThrows;

@Test
void deveLancarDomainValidationException_quandoEntradaInvalida() throws Exception {
    DomainValidationException ex = assertThrows(
        DomainValidationException.class,
        () -> service.execute(null)
    );

    assertThat(ex.getMessage()).contains("entrada invalida"); // use substring ASCII
}
```

## Execucao local

Raiz projeto:

```bash
./gradlew clean test
```

Ou no modulo:

```bash
./gradlew :<modulo-backend>:test
```

Fluxo dev Addon Studio: rode testes antes de `deployAddon`.

## Checklist rapido para PR

- [ ] Existe teste pra nova classe de servico alterada.
- [ ] Cenario sucesso + ao menos um cenario erro relevante cobertos.
- [ ] Sem dependencia externa real em teste unitario.
- [ ] `./gradlew :<modulo-backend>:test` passando local.
- [ ] `throws Exception` declarado em metodos que interagem com repositorios.
- [ ] Stubs sem acentos nas asserções de mensagem.


## Related Skills

- `repository` — JapeRepository tem quirks — leia antes de mockar
- `dependency-injection` — componentes Guice injetam dependências via construtor — facilita mock
