#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Esteira de auditoria de disparo das skills do plugin addon-studio.

Mede se cada skill dispara SEM ancora no projeto (sem CLAUDE.md / docs/ADDON.md),
usando as descriptions reais do repo. Tres eixos por skill: obvio, indireto, negativo.

  python3 audit.py build                      # gera out/: catalog, batches, prompt, key
  python3 audit.py score out/results.json     # taxa por eixo e por skill
  python3 audit.py compare antes.json depois.json

O passo do meio e manual por design: 12 subagentes cegos leem out/catalog.md +
out/batch-N.md e devolvem a tabela pedida em out/prompt.md. Ver README.md.
"""
import json
import os
import re
import sys
import unicodedata
from glob import glob

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SKILLS = os.path.join(REPO, "plugins", "addon-studio", "skills")
AGENTS = os.path.join(REPO, "plugins", "addon-studio", "agents")
OUT = os.path.join(HERE, "out")
EIXOS = ("O", "I", "N")

# posicao no batch -> indice na lista [O(2k), O(2k+1), I(2k+8), I(2k+9), N(2k+16), N(2k+17)].
# Embaralha o eixo para o agente nao inferir o padrao do lote. NAO alterar: muda o
# significado dos ids Bk Cn e invalida a comparacao com runs anteriores.
SHUFFLE = [2, 0, 4, 3, 1, 5]
OFFSETS = [(0, 0), (1, 0), (8, 1), (9, 1), (16, 2), (17, 2)]

PROMPT = """Você é o Claude Code numa sessão nova, num projeto de cliente. Vou te dar cenários de mensagem de dev e quero saber, HONESTAMENTE, se você carregaria alguma skill antes de agir.

PASSO 1 — leia SOMENTE estes dois arquivos:
- {out}/catalog.md
- {out}/batch-{k}.md

PROIBIDO ler qualquer outro arquivo, rodar grep/glob, ou explorar o repositório do plugin. Seu julgamento tem que se basear só no catálogo + a mensagem do dev. Não invente contexto que não está no catalog.md.

PASSO 2 — para CADA cenário, decida com sinceridade de sessão real:
- Você carregaria skill? Qual/quais, em ordem de probabilidade?
- Se você simplesmente responderia/codaria direto sem carregar skill nenhuma (porque parece pergunta genérica, ou porque nenhuma description bate forte), responda `NENHUMA`. Isso é uma resposta legítima e esperada em vários cenários — não force invocação.
- Confiança de 0-100 na sua primeira escolha (quão certo você está que essa é a skill certa).
- Você delegaria pra um sub-agent do plugin em vez de/além da skill? Qual?
- Uma linha: o que na description (ou a falta do quê) te fez decidir.
- Se duas ou mais descriptions competiram e ficou ambíguo, diga quais.

Regra de honestidade: não infira que "é um projeto Sankhya, então sempre carrego skill Sankhya". Decida pelo que a mensagem do dev pede e pelo que as descriptions prometem. Se a mensagem não tem nenhum termo que apareça nas descriptions, é bem provável que na prática você não carregaria nada — diga isso.

PASSO 3 — retorne SÓ isto, em markdown, sem preâmbulo:

| id | skills (ordem) | conf | sub-agent | motivo | ambiguidade |

Depois da tabela, uma seção `## Notas` com no máximo 5 bullets sobre descriptions que atrapalharam (termo faltando, sobreposição, ruído).
"""

CONTEXTO = """# Contexto simulado da sessao

Voce e o Claude Code rodando numa sessao NOVA dentro de um projeto de cliente:

```
cwd: /home/dev/projetos/vst-addon
git repo: sim (branch main)
CLAUDE.md: NAO existe no projeto
docs/ADDON.md: NAO existe no projeto
arvore (parcial):
  build.gradle            <- aplica plugin 'br.com.sankhya.addonstudio' versao 2.x
  settings.gradle
  gradlew
  src/main/java/com/vst/addon/...   (varios .java)
  src/main/resources/dbscripts/V001-init.xml
  src/main/resources/datadictionary/AD_VSTVIS.xml
  src/main/webapp/html5/
  src/test/java/com/vst/addon/...
```

Nao ha nenhuma instrucao de projeto sobre Sankhya no contexto. A UNICA coisa que voce sabe
sobre skills e o catalogo abaixo (exatamente como apareceria na sua listagem de skills disponiveis).

# Catalogo de skills disponiveis
"""

RODAPE = """
Tambem estao disponiveis (fora do plugin): skill-creator, dataviz, artifact-design,
update-config, simplify, loop, schedule, claude-api, run, init, review, security-review.

E os sub-agents do plugin (via Agent tool):
{agents}
"""


def frontmatter(path):
    txt = open(path, encoding="utf-8").read()
    fm = txt.split("---")[1]
    name = re.search(r"^name: (.+)$", fm, re.M).group(1).strip()
    desc = re.search(r"^description: (.+?)(?=\n[a-z_-]+:|\Z)", fm, re.M | re.S)
    return name, " ".join(desc.group(1).split())


def load_catalog():
    skills = [frontmatter(f) for f in sorted(glob(os.path.join(SKILLS, "*", "SKILL.md")))]
    agents = [frontmatter(f) for f in sorted(glob(os.path.join(AGENTS, "*.md")))]
    return skills, agents


def cmd_build():
    spec = json.load(open(os.path.join(HERE, "scenarios.json"), encoding="utf-8"))
    order, cenarios = spec["order"], spec["scenarios"]
    skills, agents = load_catalog()
    faltando = set(order) - {n for n, _ in skills}
    if faltando:
        sys.exit("scenarios.json cita skill inexistente: %s" % sorted(faltando))
    sem_cenario = {n for n, _ in skills} - set(order)
    if sem_cenario:
        sys.exit("skill sem cenario -- adicione 3 em scenarios.json: %s" % sorted(sem_cenario))

    os.makedirs(OUT, exist_ok=True)
    catalogo = [CONTEXTO] + ["- addon-studio:%s: %s" % (n, d) for n, d in skills]
    catalogo.append(RODAPE.format(agents="\n".join("- %s: %s" % (n, d) for n, d in agents)))
    write(os.path.join(OUT, "catalog.md"), "\n".join(catalogo))

    n = len(order)
    key, prompts = {}, []
    for k in range((n + 1) // 2):
        itens = [(order[(2 * k + off) % n], eixo) for off, eixo in OFFSETS]
        itens = [itens[i] for i in SHUFFLE]
        linhas = [
            "# Cenarios\n",
            "Cada cenario e a PRIMEIRA mensagem do dev numa sessao nova. Sao independentes entre si.\n",
        ]
        for i, (skill, eixo) in enumerate(itens, 1):
            cid = "B%dC%d" % (k + 1, i)
            key[cid] = {"skill": skill, "eixo": EIXOS[eixo]}
            linhas.append('## %s\n\n> "%s"\n' % (cid, cenarios[skill][eixo]))
        write(os.path.join(OUT, "batch-%d.md" % (k + 1)), "\n".join(linhas))
        prompts.append(PROMPT.format(out=OUT, k=k + 1))

    write(os.path.join(OUT, "key.json"), json.dumps(key, indent=1, ensure_ascii=False))
    write(os.path.join(OUT, "prompt.md"), "\n\n---\n\n".join(prompts))
    print("out/: %d skills, %d lotes, %d cenarios" % (len(skills), (n + 1) // 2, len(key)))
    print("proximo passo: 1 subagente por lote, prompts prontos em out/prompt.md")


def write(path, txt):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(txt if txt.endswith("\n") else txt + "\n")


def slug(s):
    s = unicodedata.normalize("NFD", s.lower().strip())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"^addon-studio:", "", s)


def avalia(alvo, eixo, escolhidas):
    """O/I: acerto = alvo e a 1a escolha. N: passa se o alvo nao e a 1a escolha."""
    primeira = escolhidas[0] if escolhidas else "NENHUMA"
    if eixo == "N":
        return ("PASS" if primeira != alvo else "FAIL"), primeira
    return ("HIT" if primeira == alvo else "MISS"), primeira


def load_results(path):
    """results.json: {"B1C1": {"skills": ["entity", ...], "conf": 88}}. skills vazio = NENHUMA."""
    raw = json.load(open(path, encoding="utf-8"))
    return {
        cid: {"skills": [slug(s) for s in v.get("skills", []) if slug(s) != "nenhuma"],
              "conf": v.get("conf")}
        for cid, v in raw.items() if not cid.startswith("_")
    }


def score(results_path):
    key = json.load(open(os.path.join(OUT, "key.json"), encoding="utf-8"))
    res = load_results(results_path)
    faltando = sorted(set(key) - set(res))
    if faltando:
        print("!! sem resposta para %d cenario(s): %s" % (len(faltando), " ".join(faltando)))
    rows = {}
    for cid, k in key.items():
        if cid not in res:
            continue
        veredito, primeira = avalia(k["skill"], k["eixo"], res[cid]["skills"])
        rows.setdefault(k["skill"], {})[k["eixo"]] = {
            "id": cid, "veredito": veredito, "conf": res[cid]["conf"], "primeira": primeira,
        }
    return rows


def cmd_score(path):
    rows = score(path)
    print("%-22s %-4s %-4s %-4s %5s  %s" % ("skill", "O", "I", "N", "confI", "taxa"))
    for skill in sorted(rows):
        r = rows[skill]
        ok = sum(1 for e in EIXOS if r.get(e, {}).get("veredito") in ("HIT", "PASS"))
        marca = {"HIT": "ok", "PASS": "ok", "MISS": "X", "FAIL": "X"}
        cel = [marca.get(r.get(e, {}).get("veredito"), "-") for e in EIXOS]
        confi = r.get("I", {}).get("conf")
        print("%-22s %-4s %-4s %-4s %5s  %d/3%s" % (
            skill, cel[0], cel[1], cel[2], confi if confi is not None else "-", ok,
            "" if ok == 3 else "   <-- falha: " + " ".join(
                "%s->%s" % (e, r[e]["primeira"]) for e in EIXOS
                if r.get(e, {}).get("veredito") in ("MISS", "FAIL"))))
    print()
    for e, nome in zip(EIXOS, ("obvio", "indireto", "negativo")):
        vals = [r[e] for r in rows.values() if e in r]
        ok = sum(1 for v in vals if v["veredito"] in ("HIT", "PASS"))
        confs = [v["conf"] for v in vals if v["conf"] is not None]
        media = " conf media %.0f, min %d, <=70: %d" % (
            sum(confs) / len(confs), min(confs), sum(1 for c in confs if c <= 70)) if confs else ""
        print("%-9s %2d/%-2d%s" % (nome, ok, len(vals), media))
    return rows


def cmd_compare(antes_path, depois_path):
    a, b = score(antes_path), score(depois_path)
    print("%-22s %-14s %-14s %s" % ("skill", "antes", "depois", "delta confI"))
    piora = []
    for skill in sorted(set(a) | set(b)):
        ra, rb = a.get(skill, {}), b.get(skill, {})
        def resumo(r):
            return "".join({"HIT": "O", "PASS": "N", "MISS": "x", "FAIL": "x"}.get(
                r.get(e, {}).get("veredito"), "-") for e in EIXOS)
        ca, cb = ra.get("I", {}).get("conf"), rb.get("I", {}).get("conf")
        d = "%+d" % (cb - ca) if (ca is not None and cb is not None) else "?"
        if ca is not None and cb is not None and cb < ca:
            piora.append((skill, ca, cb))
        print("%-22s %-14s %-14s %s" % (skill, "%s conf %s" % (resumo(ra), ca),
                                        "%s conf %s" % (resumo(rb), cb), d))
    for e, nome in zip(EIXOS, ("obvio", "indireto", "negativo")):
        def agg(r):
            vals = [x[e] for x in r.values() if e in x]
            ok = sum(1 for v in vals if v["veredito"] in ("HIT", "PASS"))
            confs = [v["conf"] for v in vals if v["conf"] is not None]
            return "%d/%d%s" % (ok, len(vals),
                                " conf %.0f" % (sum(confs) / len(confs)) if confs else "")
        print("%-9s antes %-16s depois %s" % (nome, agg(a), agg(b)))
    if piora:
        print("\nregressao de confianca: " + ", ".join(
            "%s %d->%d" % p for p in piora))


if __name__ == "__main__":
    args = sys.argv[1:]
    cmd = args[0] if args else ""
    if cmd == "build":
        cmd_build()
    elif cmd == "score" and len(args) == 2:
        cmd_score(args[1])
    elif cmd == "compare" and len(args) == 3:
        cmd_compare(args[1], args[2])
    else:
        sys.exit(__doc__)
