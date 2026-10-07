import { test, expect } from 'claude-code/testing'
import type { On } from 'claude-code'

const ROOT = '/addon'
const ADDON_BUILD = "plugins { id 'br.com.sankhya.addonstudio' }\n"
const JAVA_FILE = `${ROOT}/src/main/java/A.java`
const XML_HEADER = '<?xml version="1.0" encoding="ISO-8859-1" ?>\n'

// Disco em memória: fs é a fronteira do mod. A tool grava o que recebeu.
const fakeProject = (on: On, files: Record<string, string> = { [`${ROOT}/build.gradle`]: ADDON_BUILD }, toolFails = false) => {
  const disk = new Map(Object.entries(files))
  on('fs.exists', (_$, e) => ({ value: disk.has(e.path) }))
  on('fs.read', (_$, e) => {
    const text = disk.get(e.path)
    if (text === undefined) return { deny: `ENOENT: ${e.path}` }
    return { value: e.as === 'bytes' ? { base64: btoa(text) } : text }
  })
  on('fs.write', (_$, e) => {
    disk.set(e.path, e.text)
    return { value: undefined }
  })
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('tool.call', (_$, e) => {
    if (toolFails) return { result: 'erro', isError: true } as never
    const { file_path, content } = e as { file_path: string; content?: string }
    disk.set(file_path, content ?? disk.get(file_path) ?? '')
    return { result: { filePath: file_path } } as never
  })
  return disk
}

const lintOf = (ran: { context?: readonly string[] }) => (ran.context ?? []).filter(c => c.startsWith('source-lint')).join('\n')

const writeJava = async ($: Parameters<Parameters<typeof test>[1]>[0], content: string, filePath = JAVA_FILE) =>
  lintOf(await $.tool.call({ tool: 'Write', file_path: filePath, content } as never))

// Cada caso: código que viola, código parecido que não viola, e o trecho da mensagem.
const CASES: { name: string; bad: string; good: string; expected: string }[] = [
  { name: 'var', bad: 'var x = 1;', good: 'int variavel = 1;', expected: '`var`' },
  { name: 'List.of', bad: 'List<String> l = List.of("a");', good: 'List<String> l = ImmutableList.of("a");', expected: '`List.of`' },
  { name: 'Set.of', bad: 'Set<String> s = Set.of("a");', good: 'Set<String> s = ImmutableSet.of("a");', expected: '`Set.of`' },
  { name: 'Map.of', bad: 'm = Map.of();', good: 'm = Collections.emptyMap();', expected: '`Map.of`' },
  { name: 'isBlank', bad: 'if (s.isBlank()) {}', good: 'if (StringUtils.isBlank(s)) {}', expected: '`String.isBlank()`' },
  { name: 'Stream.toList', bad: 'l = s.stream().toList();', good: 'l = s.stream().collect(Collectors.toList());', expected: '`Stream.toList()`' },
  { name: 'orElseThrow', bad: 'o.orElseThrow();', good: 'o.orElseThrow(IllegalStateException::new);', expected: '`orElseThrow()`' },
  { name: 'record', bad: 'public record Ponto(int x) {}', good: 'Object record = null;', expected: '`record`' },
  { name: 'sealed', bad: 'public sealed interface Forma permits A {}', good: 'boolean sealed = true;', expected: '`sealed`' },
  { name: 'text block', bad: 'String s = """\n  oi\n  """;', good: 'String s = "\\"\\"\\"";', expected: 'text block' },
  { name: 'JPA', bad: 'import javax.persistence.Entity;', good: 'import br.com.sankhya.studio.persistence.JapeEntity;', expected: 'JPA padrão' },
  { name: 'jakarta.persistence', bad: 'import jakarta.persistence.Id;', good: 'import br.com.sankhya.studio.persistence.Id;', expected: 'JPA padrão' },
  { name: 'JapeWrapper em controller', bad: '@Controller class C { JapeWrapper w; }', good: '@Component class S { JapeWrapper w; }', expected: '`JapeWrapper`' },
  { name: 'javax.inject', bad: 'import javax.inject.Inject;', good: 'import com.google.inject.Inject;', expected: '`javax.inject`' },
  { name: 'slf4j import', bad: 'import org.slf4j.Logger;', good: 'import java.util.logging.Logger;', expected: 'SLF4J' },
  { name: '@Slf4j', bad: '@Slf4j class C {}', good: '@Log class C {}', expected: 'SLF4J' },
  { name: 'System.out', bad: 'System.out.println(x);', good: 'log.info(x);', expected: '`System.out`' },
  { name: 'RuntimeException cru', bad: 'throw new RuntimeException("x");', good: 'throw new PedidoException("x");', expected: '`RuntimeException` cru' },
  { name: '@Service', bad: '@Service class S {}', good: '@Component class S {}', expected: '`@Service`' },
  { name: '@Component em controller', bad: '@Controller @Component class C {}', good: '@Controller class C {}', expected: 'não adicione `@Component`' },
  { name: 'TxType.SUPPORTS', bad: '@Transactional(Transactional.TxType.SUPPORTS)', good: '@Transactional(Transactional.TxType.REQUIRED)', expected: '`TxType.SUPPORTS`' },
  { name: 'Transactional errado', bad: 'import javax.transaction.Transactional;', good: 'import br.com.sankhya.studio.persistence.Transactional;', expected: 'import errado de `@Transactional`' },
  { name: 'Job errado', bad: 'import br.com.sankhya.studio.stereotypes.Job;', good: 'import br.com.sankhya.studio.annotations.Job;', expected: 'import errado de `@Job`' },
  { name: 'implements IJob', bad: 'class J implements IJob {}', good: 'class J extends IJob {}', expected: '`extends IJob`' },
  { name: '@Job name', bad: '@Job(name = "X")', good: '@Job(serviceName = "X")', expected: '`@Job(serviceName' },
  { name: 'getScheduleConfigHook', bad: 'public String getScheduleConfigHook() {}', good: 'public String getScheduleConfig() {}', expected: '`getScheduleConfigHook()`' },
  { name: 'TransactionType.REQUIRES_NEW', bad: 'transactionType = TransactionType.REQUIRES_NEW', good: 'transactionType = TransactionType.AUTOMATIC', expected: '`TransactionType.REQUIRES_NEW`' },
  { name: 'FieldType.CHECKBOX', bad: 'type = FieldType.CHECKBOX', good: 'type = FieldType.BOOLEAN', expected: '`FieldType.BOOLEAN`' },
  { name: 'RefreshTypeEnum.ALL', bad: 'refreshType = RefreshTypeEnum.ALL', good: 'refreshType = RefreshTypeEnum.ALL_ITEMS', expected: '`RefreshTypeEnum.ALL`' },
  { name: 'Callback AFTER billing', bad: '@Callback(when = AFTER, event = PROCESS_BILLING)', good: '@Callback(when = BEFORE, event = PROCESS_BILLING)', expected: '`PROCESS_BILLING`' },
  { name: 'ExceptionHandler pega-tudo', bad: '@ExceptionHandler({Exception.class})', good: '@ExceptionHandler({RuntimeException.class})', expected: 'pega-tudo' },
  { name: 'ExceptionHandler vazio', bad: '@ExceptionHandler({})', good: '@ExceptionHandler({PedidoException.class})', expected: '`@ExceptionHandler({})`' },
  { name: 'findByPK Optional', bad: 'repo.findByPK(id).orElseThrow(() -> new X());', good: 'Pedido p = repo.findByPK(id);', expected: '`findByPK`' },
  { name: '@Delete', bad: '@Delete void apaga();', good: '@Modifying void apaga();', expected: '`@Delete`' },
  { name: '@Modifying int', bad: '@Modifying\n@NativeQuery("x")\nint apaga();', good: '@Modifying\nvoid apaga();', expected: '`@Modifying` retornando `int`' },
  { name: 'NativeQuery errado', bad: 'import br.com.sankhya.sdk.data.repository.NativeQuery;', good: 'import br.com.sankhya.studio.persistence.NativeQuery;', expected: 'import errado de `@NativeQuery`' },
  { name: 'Pageable.of', bad: 'Pageable p = Pageable.of(0, 50);', good: 'Pageable p = PageRequest.of(0, 50);', expected: '`PageRequest.of' },
  { name: 'getTotalElements', bad: 'page.getTotalElements();', good: 'page.hasNext();', expected: '`Page<T>` não tem total' },
  { name: 'JdbcWrapper errado', bad: 'import br.com.sankhya.jape.util.JdbcWrapper;', good: 'import br.com.sankhya.jape.dao.JdbcWrapper;', expected: '`br.com.sankhya.jape.dao.JdbcWrapper`' },
  { name: 'getVo sem cast', bad: 'DynamicVO vo = event.getVo();', good: 'DynamicVO vo = (DynamicVO) event.getVo();', expected: '`getVo()` sem cast' },
  { name: '@Value final', bad: '@Value(param = "X", type = ValueType.SANKHYA_PARAM)\nprivate final String x;', good: '@Value(param = "X", type = ValueType.SANKHYA_PARAM)\nprivate String x;', expected: 'campo `final`' },
  { name: '@Value value e param', bad: '@Value(value = "a", param = "b")', good: '@Value(param = "b")', expected: 'só `param`' },
  { name: '@Value group fora de SANKHYA_PARAM', bad: '@Value(value = "A", type = ValueType.ENV_VAR, group = "g")', good: '@Value(param = "A", type = ValueType.SANKHYA_PARAM, group = "g")', expected: '`group` só funciona' },
]

for (const { name, bad, good, expected } of CASES) {
  test(`Java: ${name} dispara`, async ($, on) => {
    fakeProject(on)
    expect(await writeJava($, bad)).toContain(expected)
  })

  test(`Java: ${name} correto não dispara`, async ($, on) => {
    fakeProject(on)
    expect(await writeJava($, good)).toBe('')
  })
}

test('padrão dentro de comentário e de string não dispara', async ($, on) => {
  fakeProject(on)
  const content = [
    '// var x = List.of(); System.out.println',
    '/* throw new RuntimeException("x"); @Service',
    '   import javax.inject.Inject; */',
    'String s = "var x = 1; @Service System.out";',
    "char c = '\"';",
    'String t = "\\" var y = List.of()";',
  ].join('\n')

  expect(await writeJava($, content)).toBe('')
})

test('aviso aponta a linha e a skill de origem', async ($, on) => {
  fakeProject(on)
  const lint = await writeJava($, 'class A {\n  /* var a = 1; */\n  void f() { System.out.println(1); }\n}')

  expect(lint).toContain('linha 3: `System.out`')
  expect(lint).toContain('[init/assets/ADDON.md:15, job/SKILL.md:336]')
})

test('arquivo fora de projeto addon não é verificado', async ($, on) => {
  fakeProject(on, { '/outro/build.gradle': "plugins { id 'java' }\n" })

  expect(await writeJava($, 'var x = 1;', '/outro/A.java')).toBe('')
})

test('extensão fora de .java e XML de dicionário/dbscript não é verificada', async ($, on) => {
  fakeProject(on)

  expect(await writeJava($, 'var x = 1;', `${ROOT}/README.md`)).toBe('')
  expect(await writeJava($, '<root/>', `${ROOT}/src/main/resources/META-INF/parameter.xml`)).toBe('')
})

test('Write com tool falhando não verifica', async ($, on) => {
  fakeProject(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD }, true)

  expect(await writeJava($, 'var x = 1;')).toBe('')
})

test('Edit verifica só o new_string', async ($, on) => {
  fakeProject(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD, [JAVA_FILE]: 'var antigo = 1;\nint y = 0;\n' })

  const limpo = await $.tool.call({ tool: 'Edit', file_path: JAVA_FILE, old_string: 'int y = 0;', new_string: 'int y = 1;' } as never)
  const sujo = await $.tool.call({ tool: 'Edit', file_path: JAVA_FILE, old_string: 'int y = 1;', new_string: 'int y = 1;\nvar z = 2;' } as never)

  expect(lintOf(limpo)).toBe('')
  expect(lintOf(sujo)).toContain('linha 2: `var`')
  expect(lintOf(sujo)).toContain('new_string')
})

test('XML de dbscript sem cabeçalho ISO-8859-1 dispara', async ($, on) => {
  fakeProject(on)

  expect(await writeJava($, '<scripts/>', `${ROOT}/dbscripts/V001-x.xml`)).toContain('sem cabeçalho obrigatório')
  expect(await writeJava($, '<?xml version="1.0" encoding="UTF-8" ?>\n<scripts/>', `${ROOT}/dbscripts/V002-x.xml`)).toContain('encoding diferente')
  expect(await writeJava($, `${XML_HEADER}<metadados/>`, `${ROOT}/datadictionary/AD_X.xml`)).toBe('')
})

test('Edit de XML só dispara quando o trecho novo troca o encoding', async ($, on) => {
  const file = `${ROOT}/datadictionary/AD_X.xml`
  fakeProject(on, { [`${ROOT}/build.gradle`]: ADDON_BUILD, [file]: `${XML_HEADER}<metadados/>` })

  const campo = await $.tool.call({ tool: 'Edit', file_path: file, old_string: '<metadados/>', new_string: '<metadados></metadados>' } as never)
  const cabecalho = await $.tool.call({ tool: 'Edit', file_path: file, old_string: XML_HEADER, new_string: '<?xml version="1.0" encoding="UTF-8" ?>\n' } as never)

  expect(lintOf(campo)).toBe('')
  expect(lintOf(cabecalho)).toContain('encoding diferente')
})
