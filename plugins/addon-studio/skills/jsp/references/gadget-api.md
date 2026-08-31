# A API injetada pelo `<snk:load/>`

A tag `<snk:load/>` (`HTMLGadgetSetupTag`) emite um `<script>` com cinco funções globais.
Ela existe porque a tela nasceu no Dashboard: no gadget, a página rodava num iframe e falava
com o dashboard pai por um objeto `contextPage`. Fora do dashboard esse objeto não existe, e
as funções precisam de destinos próprios — é isso que o template de
[`../templates/HTMLGadgetSetupTag.java`](../templates/HTMLGadgetSetupTag.java) implementa.

A assinatura das cinco é a mesma do gadget, de propósito: um `.jsp` portado do dashboard
roda sem alteração.

---

## `executeQuery(query, params, onSuccess, onError)`

Executa um SELECT e devolve o resultado ao callback.

```js
executeQuery(sql, [], function (val) {
  var linhas = JSON.parse(val);
  // linhas = [{COLUNA: "valor", ...}, ...]
}, function (err) {
  console.error(err);
});
```

**`onSuccess` recebe uma string**, não um objeto — daí o `JSON.parse`. E **todo valor vem
como string**, inclusive coluna numérica e data. É o contrato do gadget, mantido para que o
JS existente continue funcionando; converta no cliente (`parseFloat`, etc.).

### Quem executa a query

O add-on **não** precisa de servlet nem endpoint próprio: quem executa é o serviço nativo
**`ExecQuerySP.execQuery`**, o mesmo que o dashboard sempre usou. A implementação o chama por
HTTP a partir da própria página, com a sessão do usuário.

Três consequências que compensam a escolha:

- **Autorização é a da plataforma.** O serviço tem controle de acesso próprio, por recurso.
  Não há regra de segurança escrita pelo add-on, e portanto nada para manter.
- **Teto de linhas é o da plataforma.** O serviço corta o resultado num teto fixo, e o
  parâmetro **`MAXROWEXECQUERY`** ajusta o limite quando o cliente não pede um valor
  explícito. Pedir `maxRows = -1` — o que o gadget faz e o template reproduz — usa o teto
  máximo e ignora o parâmetro, cujo padrão é menor.
- **Timeout e datasource** ficam com o serviço, que já sabe desviar consulta de leitura para
  onde o ambiente mandar.

### O teto e a paginação

O teto é a razão de telas densas paginarem. O padrão que funciona é pedir blocos do tamanho
do teto (`OFFSET n ROWS FETCH NEXT <teto> ROWS ONLY`) e continuar enquanto a página vier
cheia — página incompleta significa fim dos dados.

O detalhe que morde: **se o tamanho do bloco no JavaScript não for o mesmo teto que o
servidor aplica**, a primeira página já volta menor que o bloco, o laço entende "acabou" e a
carga para. O resultado fica truncado sem erro nenhum — um dashboard mostrando 1% do valor
real e parecendo correto. Ao mexer no tamanho de bloco ou no parâmetro do sistema, mexa nos
dois juntos.

O template pede explicitamente o teto máximo no envio da consulta, reproduzindo o que o
gadget fazia. Omitir esse pedido faz o serviço cair no parâmetro do sistema, cujo valor
padrão é menor — e aí a armadilha acima passa a valer.

### Erro chega por dois caminhos

Falha de transporte (rede, sessão) e falha da consulta são coisas diferentes: **uma query
inválida volta com status de sucesso**, com o erro dentro do corpo da resposta. Sem tratar os
dois, SQL quebrado chega à tela como lista vazia e o painel mostra zero em vez de reclamar.

### Parâmetros

O segundo argumento aceita valores posicionais, casados com `?` no SQL. Na prática a maioria
das telas monta o SQL inteiro e passa `[]`, mas o caminho existe e é preferível quando o
valor vem do usuário.

---

## `openApp(resourceID, pkObject)`

Abre uma tela do Sankhya, posicionada num registro.

```js
openApp('<resourceId da tela de destino>', {CODPARC: Number(cod)});
```

Quem abre a tela é o **workspace** que hospeda o `.jsp` num iframe — por isso a tela precisa
ser aberta pelo menu, e não pela URL direta. O template resolve o workspace a cada chamada
(não no load: a página pode carregar antes do pai, e todo uso é sob clique) e tolera não
achá-lo, registrando aviso no console em vez de estourar.

**O `pkObject` vai inteiro, sem serializar.** A tela de destino o recebe em `$scope.loadByPK`
e usa para posicionar o dataset — a chave precisa ser o nome da coluna da PK. Filtrar,
achatar ou virar query string quebra esse mecanismo.

Uma sutileza que vale conhecer antes de tentar "melhorar" a implementação: em modo
multi-abas, a plataforma **substitui** o método de abertura por uma versão que troca mensagem
entre janelas. Chamar o método cobre os dois modos de graça; reimplementar o que ele faz
quebra em um deles.

---

## `openLevel(nivel, params)`

No dashboard, navegava entre níveis do gadget. Fora dele, `nivel` é a **URL da próxima
view** — relativa resolve ao lado do `.jsp` atual, que é o que torna natural uma pasta com
várias telas e um entrypoint.

```js
openLevel('Detalhe.jsp', {CODPARC: cod});
```

Os `params` viram query string, lidos no destino com `request.getParameter`. Cuidado com uma
herança do gadget: a implementação antiga fazia `window.open(nivel, '_self', params)`, e ali
os params **eram descartados em silêncio** — o terceiro argumento de `window.open` é string
de features, não objeto.

O contexto da tela atual (identificador de sessão e do recurso) acompanha a navegação, senão
a próxima página nasce sem ele.

Valores de `params` que sejam objeto viram `[object Object]`: serve para PK e filtro simples,
não para payload.

---

## `refreshDetails(componentID, params)`

No dashboard, mandava o dashboard recarregar um componente. Sem ele, o equivalente honesto é
recarregar a página — que é o que o nome promete. Aceita e ignora os argumentos, que só
faziam sentido apontando para um gadget.

---

## `openPage(page, params)`

Abre uma URL em nova aba. É a única das cinco que não dependia do dashboard, e por isso
atravessa a portabilidade sem mudança.

---

## Ao portar um gadget

A tela costuma vir inteira e funcionar de primeira, porque as assinaturas foram preservadas.
O que exige atenção:

1. **`openLevel` e `refreshDetails`** apontavam para componentes do dashboard. Verifique se a
   tela os usa e para quê — pode não haver destino equivalente.
2. **Parâmetros do gadget.** Telas de gadget liam valores injetados pelo servlet do dashboard
   (atributos da requisição). Uma tela standalone recebe parâmetros pela URL.
3. **O teto de linhas** e a lógica de paginação, se houver (ver acima).
4. **Recursos externos** que vinham empacotados com o gadget precisam vir junto para o
   `webapp/` do add-on.
