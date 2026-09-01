<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="true"%>
<%@ page import="java.util.SortedMap" %>
<%@ page import="javax.servlet.jsp.jstl.sql.Result" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%--
  Tela .jsp do add-on. Duas formas de trazer dado, e elas nao competem:

  snk:query   roda no servidor, durante o render. A pagina ja nasce com os dados.
              Bom para carga unica; a tela so muda com reload.
  executeQuery roda no cliente, depois do load. Permite recarregar sem sair da
              pagina, paginar e reagir a filtro. Custa uma ida ao servidor.

  Este template usa as duas para mostrar o contrato de cada uma.
--%>
<snk:query var="registros" maxRows="50">
SELECT CODPARC, NOMEPARC, ATIVO
  FROM TGFPAR
 ORDER BY CODPARC
</snk:query>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Minha Tela</title>
<%-- A tag snk:load injeta a API (executeQuery, openApp, openLevel, refreshDetails,
     openPage). Precisa vir antes de qualquer script que use essas funcoes. --%>
<snk:load/>
<style>
  body{font:13px/1.5 system-ui,sans-serif;margin:0;padding:16px;color:#1c2530}
  table{border-collapse:collapse;width:100%;font-size:12px}
  th,td{border-bottom:1px solid #eceff2;padding:5px 8px;text-align:left}
  th{background:#f2f4f7}
  button{font:inherit;padding:5px 11px;border:1px solid #c3cad3;background:#fff;border-radius:4px;cursor:pointer}
</style>
</head>
<body>

<h1>Minha Tela</h1>

<%-- -- 1. carga server-side: snk:query ------------------------------------- --%>
<%
  Result rs = (Result) pageContext.getAttribute("registros");
  SortedMap[] linhas = (rs == null) ? new SortedMap[0] : rs.getRows();
%>
<table>
  <thead><tr><th>Codigo</th><th>Nome</th><th>Ativo</th><th></th></tr></thead>
  <tbody>
<% for (SortedMap l : linhas) { %>
    <tr>
      <td><%= l.get("CODPARC") %></td>
      <td><%= l.get("NOMEPARC") == null ? "" : l.get("NOMEPARC") %></td>
      <td><%= l.get("ATIVO") %></td>
      <td><button onclick="abrir(<%= l.get("CODPARC") %>)">abrir</button></td>
    </tr>
<% } %>
  </tbody>
</table>

<%-- -- 2. carga client-side: SQL declarado aqui, executado pelo executeQuery -
     O bloco fica num script type="text/plain" porque nao e codigo: o browser
     nao interpreta, e o JS le o texto com textContent quando precisa. --%>
<script type="text/plain" id="sqlAtivos">
SELECT CODPARC, NOMEPARC
  FROM TGFPAR
 WHERE ATIVO = 'S'
 ORDER BY NOMEPARC
</script>

<p><button onclick="recarregar()">recarregar sem sair da pagina</button>
   <span id="status"></span></p>
<ul id="lista"></ul>

<script>
// executeQuery devolve o resultado como STRING JSON -- por isso o JSON.parse.
// Todos os valores chegam como string, mesmo coluna numerica.
function recarregar(){
  var sql = document.getElementById('sqlAtivos').textContent;
  document.getElementById('status').textContent = 'carregando...';

  executeQuery(sql, [], function(val){
    var linhas = JSON.parse(val);
    var ul = document.getElementById('lista');
    ul.innerHTML = '';
    for (var i = 0; i < linhas.length; i++){
      var li = document.createElement('li');
      li.textContent = linhas[i].CODPARC + ' - ' + linhas[i].NOMEPARC;
      ul.appendChild(li);
    }
    document.getElementById('status').textContent = linhas.length + ' registro(s)';
  }, function(err){
    document.getElementById('status').textContent = 'falhou: ' + err;
  });
}

// openApp abre uma tela do Sankhya. O 2o argumento e o pkObject: a tela de
// destino o recebe em $scope.loadByPK e posiciona o registro. Por isso ele vai
// inteiro, sem serializar -- a chave tem que ser o nome da coluna da PK.
function abrir(codparc){
  openApp('<resourceId da tela de destino>', {CODPARC: Number(codparc)});
}

// openLevel navega para outra view desta mesma pasta. Caminho relativo resolve
// ao lado deste .jsp; os params viram query string, lidos la com request.getParameter.
function verDetalhe(codparc){
  openLevel('Detalhe.jsp', {CODPARC: codparc});
}
</script>

</body>
</html>
