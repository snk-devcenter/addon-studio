// TEMPLATE -- antes de usar, troque o package pelo do seu add-on e faca o
// <tag-class> do sankhyaUtil.tld apontar para a mesma FQN.
package br.com.sankhya.<addon>.servlet.taglibs;

import java.io.IOException;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.BodyTagSupport;

public class HTMLGadgetSetupTag extends BodyTagSupport {

	public int doStartTag() throws JspException {
		String resourceId = pageContext.getRequest().getParameter("resourceID");
		String mgeSession = pageContext.getRequest().getParameter("mgeSession");

        StringBuffer html = new StringBuffer();
		html.append("<script type=\"text/javascript\">");

		html.append("var resourceID = ").append(jsString(resourceId)).append(";");
		html.append("var mgeSession = ").append(jsString(mgeSession)).append(";");

		// Sem dashboard nao existe contextPage. O destino equivalente e o workspace do
		// Sankhya, que hospeda a tela quando ela e aberta pelo menu. Resolvido a cada
		// chamada -- a pagina pode carregar antes do pai, e todo uso e sob clique.
		html.append("function __snkWorkspace() {");
		html.append("try { if (window.top && window.top.workspace && window.top.workspace.openAppActivity) return window.top.workspace; } catch (e) {}");
		html.append("try { if (window.parent && window.parent.workspace && window.parent.workspace.openAppActivity) return window.parent.workspace; } catch (e) {}");
		html.append("return null;");
		html.append("};");

		// openAppActivity e chamado, nunca reimplementado: em modo multi-abas a plataforma
		// substitui esse metodo por uma versao que troca mensagem entre janelas. Delegar
		// cobre os dois modos; reproduzir o que ele faz quebra em um deles.
		html.append("function openApp(resourceID, params) {");
		html.append("var ws = __snkWorkspace();");
		html.append("if (!ws) { console.warn('openApp: workspace do Sankhya nao alcancavel; abra a tela pelo menu.'); return; }");
		html.append("ws.openAppActivity(resourceID, params);");
		html.append("};");

		// O gadget nunca teve endpoint proprio: quem executa a consulta e o servico nativo
		// ExecQuerySP. Aqui e a mesma chamada, por HTTP, com a sessao do usuario -- por isso
		// o add-on nao precisa de servlet, e autorizacao e teto de linha seguem os da
		// plataforma.
		//
		// A query viaja como CONTEUDO de elemento, nao como atributo: atributo XML normaliza
		// quebra de linha, e SQL com comentario "--" perderia da\u00ed em diante. O ExecQuerySP
		// aceita as duas formas (atributo primeiro, depois filho).
		//
		// maxRows=-1 reproduz o gadget: valor <=0 faz o servico usar o teto maximo e ignorar
		// o parametro MAXROWEXECQUERY, cujo padrao e menor. E desse teto que sai o tamanho de
		// bloco usado na paginacao -- pedir outro valor a desalinha e trunca em silencio.
		html.append("function executeQuery(query, params, callbackJsSucessFunction, callbackJsErrorFunction) {");
		html.append("var qd = { query: { '$': query }, config: { name: 'maxRows', value: '-1' } };");
		html.append("if (params && params.length) {");
		html.append("var ps = [];");
		html.append("for (var i = 0; i < params.length; i++) { ps.push({ type: (typeof params[i] === 'number' ? 'N' : 'S'), value: String(params[i]) }); }");
		html.append("qd.param = ps;");
		html.append("}");
		html.append("var url = '/mge/service.sbr?serviceName=ExecQuerySP.execQuery&outputType=json'");
		html.append(" + (mgeSession ? '&mgeSession=' + encodeURIComponent(mgeSession) : '');");
		html.append("fetch(url, { method: 'POST', credentials: 'same-origin',");
		html.append(" headers: { 'Content-Type': 'application/json' },");
		html.append(" body: JSON.stringify({ serviceName: 'ExecQuerySP.execQuery', requestBody: { querydata: qd } }) })");
		html.append(".then(function (r) { return r.json(); })");
		html.append(".then(function (j) {");
		html.append("var body = j.responseBody || {};");
		html.append("if (String(j.status) !== '1') { callbackJsErrorFunction(j.statusMessage || 'Falha ao executar a consulta.'); return; }");
		html.append("if (body.queryExecResult) { callbackJsErrorFunction(__snkErroQuery(body.queryExecResult)); return; }");
		html.append("callbackJsSucessFunction(JSON.stringify(__snkLinhas(body)));");
		html.append("})");
		html.append(".catch(function (e) { callbackJsErrorFunction(e && e.message ? e.message : String(e)); });");
		html.append("};");

		// line e column chegam como objeto unico quando ha so um -- normaliza para array.
		html.append("function __snkArr(v) { return v == null ? [] : (Object.prototype.toString.call(v) === '[object Array]' ? v : [v]); };");

		// query invalida volta com status 1 e o erro dentro de responseBody.queryExecResult
		html.append("function __snkErroQuery(q) { var e = __snkArr(q)[0]; return 'ERRO AO EXECUTAR QUERY: ' + ((e && e.ERRO) ? e.ERRO : ''); };");

		// entity.line[].column[] {name,value} -> array de objetos. Coluna nula vira string
		// vazia, como o gadget fazia: undefined sumiria no JSON.stringify e a chave nao existiria.
		html.append("function __snkLinhas(body) {");
		html.append("var linhas = __snkArr(body.entity ? body.entity.line : null), out = [];");
		html.append("for (var i = 0; i < linhas.length; i++) {");
		html.append("var cols = __snkArr(linhas[i].column), o = {};");
		html.append("for (var j = 0; j < cols.length; j++) { o[cols[j].name] = (cols[j].value === undefined ? '' : cols[j].value); }");
		html.append("out.push(o);");
		html.append("}");
		html.append("return out;");
		html.append("};");

		// Fora do dashboard, 'nivel' e a URL da proxima view -- relativa resolve na pasta
		// da tela atual, que e o "folder com varias views". O window.open(nivel,'_self',params)
		// do legado descartava os params em silencio: o 3o argumento de window.open e string
		// de features, nao objeto. Aqui eles viram query string, e o contexto da tela atual
		// (mgeSession/resourceID) e propagado para a proxima.
		html.append("function openLevel(nivel, params) {");
		html.append("var q = [];");
		html.append("if (mgeSession) q.push('mgeSession=' + encodeURIComponent(mgeSession));");
		html.append("if (resourceID) q.push('resourceID=' + encodeURIComponent(resourceID));");
		html.append("var p = params || {};");
		html.append("for (var k in p) { if (p.hasOwnProperty(k)) q.push(encodeURIComponent(k) + '=' + encodeURIComponent(p[k])); }");
		html.append("var url = nivel + (q.length ? (nivel.indexOf('?') < 0 ? '?' : '&') + q.join('&') : '');");
		html.append("window.location.assign(url);");
		html.append("};");

		html.append("function refreshDetails(componentID, params) {");
		html.append("window.location.reload();");
		html.append("};");

		html.append("function openPage(page, params) {");
		html.append("var myWindow = window.open(page, \"_blank\", params);");
		html.append("};");

		html.append("</script>");

		try {
			pageContext.getOut().write(html.toString());
		} catch (IOException ioe) {
            throw new JspException(ioe.getMessage());
		}
		return EVAL_BODY_INCLUDE;
	}

	/**
	 * Literal JavaScript a partir de valor de query string. Alem das aspas, escapa
	 * &lt; &gt; &amp;: um "&lt;/script&gt;" cru no valor encerraria o bloco na cara do parser.
	 * Valor ausente vira o literal null, nao a string "null".
	 */
	private static String jsString(String valor) {
		if (valor == null) {
			return "null";
		}

		StringBuilder sb = new StringBuilder(valor.length() + 8);
		sb.append('\'');

		for (int i = 0; i < valor.length(); i++) {
			char c = valor.charAt(i);

			switch (c) {
				case '\'': sb.append("\\'"); break;
				case '"': sb.append("\\\""); break;
				case '\\': sb.append("\\\\"); break;
				case '\n': sb.append("\\n"); break;
				case '\r': sb.append("\\r"); break;
				case '<': sb.append("\\u003C"); break;
				case '>': sb.append("\\u003E"); break;
				case '&': sb.append("\\u0026"); break;
				default:
					if (c < 0x20) {
						sb.append(String.format("\\u%04X", (int) c));
					} else {
						sb.append(c);
					}
			}
		}

		sb.append('\'');
		return sb.toString();
	}
}
