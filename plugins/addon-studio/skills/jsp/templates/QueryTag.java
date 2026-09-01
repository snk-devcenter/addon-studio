package br.com.sankhya.<addon>.servlet.taglibs;

import br.com.sankhya.jape.EntityFacade;
import br.com.sankhya.jape.core.JapeSession;
import br.com.sankhya.jape.dao.DataSourceDescriptor;
import br.com.sankhya.jape.dao.JdbcWrapper;
import br.com.sankhya.jape.sql.NativeSql;
import br.com.sankhya.modelcore.util.CentralCertificacaoRelatorios;
import br.com.sankhya.modelcore.util.EntityFacadeFactory;
import br.com.sankhya.util.troubleshooting.SKError;
import br.com.sankhya.util.troubleshooting.TSLevel;

import com.sankhya.util.BigDecimalUtil;
import com.sankhya.util.SQLUtils;
import com.sankhya.util.StringUtils;
import com.sankhya.util.regex.Regex;
import com.sankhya.util.regex.RegexMatcher;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.MissingResourceException;
import java.util.regex.Pattern;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.JspTagException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.jstl.sql.Result;
import javax.servlet.jsp.jstl.sql.SQLExecutionTag;
import javax.servlet.jsp.tagext.BodyTagSupport;

public class QueryTag extends BodyTagSupport implements SQLExecutionTag {
	private static final String		IMPL_RE2J						= "com.google.re2j";

	private static final String		REQUEST							= "request";
	private static final String		SESSION							= "session";
	private static final String		APPLICATION						= "application";
	private static final Regex		regexNamedParams_Old			= Regex.compile(":[(]\\s*\\b(.+?\\s*,\\s*\\w+)?\\b\\s*[)]", Pattern.CASE_INSENSITIVE | Pattern.DOTALL | Pattern.MULTILINE, IMPL_RE2J);
	private static final Regex		regexNamedParamsInClause_Old	= Regex.compile(":[(]\\s*\\b\\w+(\\.\\w+)?\\b\\s*,\\s*\\b\\w+(\\.\\w+)?\\b\\s*,\\s*\\b\\w+(\\.\\w+)?\\b\\s*[)]", Pattern.CASE_INSENSITIVE | Pattern.DOTALL | Pattern.MULTILINE, IMPL_RE2J);
	private static final Regex		regexNamedParams				= Regex.compile(":[^(]\\w+(\\.\\w+)?[^)]", Pattern.CASE_INSENSITIVE | Pattern.DOTALL | Pattern.MULTILINE, IMPL_RE2J);
	private static final Regex		regexNamedParamsInClause		= Regex.compile("\\s*\\b\\w+(\\.\\w+)?\\b\\s+(NOT)?\\s*IN\\s+[(]:\\w+\\s*[)]", Pattern.CASE_INSENSITIVE | Pattern.DOTALL | Pattern.MULTILINE, IMPL_RE2J);

	private static String           translatedDefaultDatasourceName = StringUtils.getEmptyAsNull(System.getProperty("skw.datasource.gadget"));

	private String					var;
	private int						scope;
	private String					dataSource;
	private String					sql;
	private int						maxRows;
	private int						startRow;

	public QueryTag() {
		super();
		init();
	}

	private void init() {
		startRow = 0;
		maxRows = -1;
		sql = null;
		var = null;
		scope = PageContext.PAGE_SCOPE;
		dataSource = null;
	}

	public void setVar(String var) {
		this.var = var;
	}

	public void setScope(String scopeName) {
		scope = PageContext.PAGE_SCOPE; // default

		if (REQUEST.equalsIgnoreCase(scopeName)) {
			scope = PageContext.REQUEST_SCOPE;
		} else if (SESSION.equalsIgnoreCase(scopeName)) {
			scope = PageContext.SESSION_SCOPE;
		} else if (APPLICATION.equalsIgnoreCase(scopeName)) {
			scope = PageContext.APPLICATION_SCOPE;
		}
	}

	public void setDataSource(String dataSource) {
		this.dataSource = dataSource;
	}

	public void setStartRow(String startRowStr) {
		try {
			this.startRow = Integer.parseInt(startRowStr);
		} catch (NumberFormatException ignored) {
			//Caso nao conseguir parsear ser\u00e1 o valor default
		}
	}

	public void setMaxRows(String maxRowsStr) {
		try {
			this.maxRows = Integer.parseInt(maxRowsStr);
		} catch (NumberFormatException ignored) {
			//Caso nao conseguir parsear ser\u00e1 o valor default
		}
	}

	public void setSql(String sqlStr) {
		this.sql = sqlStr;
	}

	public int doStartTag() throws JspException {
		return EVAL_BODY_BUFFERED;
	}

	public int doEndTag() throws JspException {
		JapeSession.SessionHandle hnd = null;
		DataAcess da = null;


		if (startRow < 0) {
			throw (JspException) SKError.registry(TSLevel.ERROR, "CORE_E00069", new JspException("Parametro startRow inv\u00e1lido."));
		}
		if (maxRows < -1) {
			throw (JspException) SKError.registry(TSLevel.ERROR, "CORE_E00070", new JspException("Parametro maxRows inv\u00e1lido."));
		}

		Result result = null;
		String sqlStatement = getSqlStatement();

		try {
			hnd = JapeSession.open();
			da = new DataAcess();

			if (dataSource == null || DataSourceDescriptor.isDefaultDs(dataSource)) {
				if (translatedDefaultDatasourceName != null) {
					da.jdbc = EntityFacade.getJdbcWrapperFromOtherDataSource(translatedDefaultDatasourceName);
					da.canClose = true;
				} else {
					da.jdbc = EntityFacadeFactory.getDWFFacade().getJdbcWrapper();
				}

				da.command = CentralCertificacaoRelatorios.replaceQuery(CentralCertificacaoRelatorios.addSQLPlaceHolder(sqlStatement.toString()), true);
			} else {
				da.jdbc = EntityFacade.getJdbcWrapperFromOtherDataSource(dataSource);
				da.command = sqlStatement;
				da.canClose = true;
			}

			NativeSql query = new NativeSql(da.jdbc);

			if (maxRows > -1) {
				query.setMaxRows(maxRows);
			}

			query.appendSql(da.command);

			addNamedParameters(query);

			ResultSet rset = query.executeQuery();
			result = new ResultImpl(rset, startRow, maxRows);
			rset.close();
		} catch (Throwable e) {
			throw (JspException) SKError.registry(TSLevel.ERROR, "CORE_E00071", new JspException(sqlStatement + ": " + e.getMessage(), e));
		} finally {
			DataAcess.close(da);
			JapeSession.close(hnd);
		}

		pageContext.setAttribute(var, result, scope);
		return EVAL_PAGE;
	}

	private void addNamedParameters(NativeSql sql) throws JspException {

		RegexMatcher matcher = regexNamedParams_Old.matcher(sql.getSqlBuf().toString());
		RegexMatcher matcherWhere = regexNamedParams.matcher(sql.getSqlBuf().toString());
		RegexMatcher matcherInClause = regexNamedParamsInClause_Old.matcher(sql.getSqlBuf().toString());
		String sqlQuery = sql.getSqlBuf().toString();

		sqlQuery = processMatcherInClause(matcherInClause, sqlQuery);
		sqlQuery = processMatcherParam(sql, matcherWhere, sqlQuery);
		sqlQuery = processMatcherOld(sql, matcher, sqlQuery);

		sql.resetSqlBuf();
		sql.appendSql(sqlQuery);
	}

	private String processMatcherOld(NativeSql sql, RegexMatcher matcher, String sqlQuery) throws JspException {
		while (matcher.find()) {
			String pNameAndType = matcher.group();
			pNameAndType = pNameAndType.substring(2); // retira o ':' e '('
			String nameType[] = pNameAndType.split(",");
			String pName = nameType[0].trim();
			String pType = nameType[1].replaceAll("[)]", "");

			sqlQuery = sqlQuery.replace(matcher.group(), ":" + pName);
			Object pValue = pageContext.getRequest().getAttribute(pName);
			if (pValue != null && !StringUtils.isEmpty(pValue.toString())) {
				sql.setNamedParameter(pName, prepareValue(pValue, pType));
			} else {
				sql.setNamedParameter(pName, null);
			}
		}
		return sqlQuery;
	}

	private String processMatcherParam(NativeSql sql, RegexMatcher matcherValid, String sqlQuery) throws JspException {
		while (matcherValid.find()) {
			String pNameAndType = matcherValid.group();
			pNameAndType = pNameAndType.substring(1); // retira o ':'
			String pName = pNameAndType.toString().trim();

			RegexMatcher macherWhereIN = regexNamedParamsInClause.matcher(sqlQuery.toString());

			if (macherWhereIN.find(0)) {
				// Tratar RegEx para condi\u00e7\u00f5es In Clause
				String currentInClouse = macherWhereIN.group();
				currentInClouse = currentInClouse.replace("(", "").replace(":", "").replace(")", "").toUpperCase(); // retira o ':(' e ')'
				String fieldName = currentInClouse.split("\\b(NOT\\s+IN|IN)\\b")[0].trim();
				String pInName = currentInClouse.split("\\b(NOT\\s+IN|IN)\\b")[1].trim();

				Object pValue = pageContext.getRequest().getAttribute(pInName);
				Object tInValue = pageContext.getRequest().getAttribute(pInName + "_TYPE"); //Verificar Tipo de dados no Request
				String inClause = null;
				if (currentInClouse.matches(".*(\\bNOT\\b\\s+IN).*")) {
					inClause = SQLUtils.buildNOTINClauseByValues(fieldName, prepareValue(pValue, tInValue.toString()).toString());
				} else {
					inClause = SQLUtils.buildINClauseByValues(fieldName, prepareValue(pValue, tInValue.toString()).toString());
				}
				sqlQuery = sqlQuery.replace(macherWhereIN.group(), inClause);
			}

			sqlQuery = sqlQuery.replace(matcherValid.group(), ":" + pName + " ");

			Object pValue = pageContext.getRequest().getAttribute(pName);

			if (pName.endsWith(".INI")) {
				String paramDTName = pName.substring(0, pName.indexOf(".INI"));
				Period pDTValue = (Period) pageContext.getRequest().getAttribute(paramDTName);
				pValue = pDTValue.getINI();
			} else if(pName.endsWith(".FIN")) {
				String paramDTName = pName.substring(0, pName.indexOf(".FIN"));
				Period pDTValue = (Period) pageContext.getRequest().getAttribute(paramDTName);
				pValue = pDTValue.getFIN();
			}

			if (pValue != null && !StringUtils.isEmpty(pValue.toString())) {
				Object tValue = pageContext.getRequest().getAttribute(pName + "_TYPE"); //Verificar Tipo de dados no Request
				sql.setNamedParameter(pName, prepareValue(pValue, tValue.toString()));
			} else {
				sql.setNamedParameter(pName, null);
			}
		}
		return sqlQuery;
	}

	private String processMatcherInClause(RegexMatcher matcherInClause, String sqlQuery) throws JspException {
		while (matcherInClause.find()) {
			String pNameAndTypeAndColumn = matcherInClause.group();
			pNameAndTypeAndColumn = pNameAndTypeAndColumn.substring(2, pNameAndTypeAndColumn.length() - 1); // retira o ':(' e ')'
			String pName = ((String) pNameAndTypeAndColumn.split(",")[0]).trim();
			String pType = ((String) pNameAndTypeAndColumn.split(",")[1]).trim();
			String pColumn = ((String) pNameAndTypeAndColumn.split(",")[2]).trim();

			Object pValue = pageContext.getRequest().getAttribute(pName);

			if (pType.equalsIgnoreCase("IN") && pValue != null && !StringUtils.isEmpty(pValue.toString()) && !StringUtils.isEmpty(pColumn.toString())) {
				String inClause = SQLUtils.buildINClauseByValues(pColumn, pValue.toString());
				sqlQuery = sqlQuery.replace(matcherInClause.group(), inClause);
			} else {
				throw (JspException) SKError.registry(TSLevel.ERROR, "CORE_E00072", new JspException("O par\u00e2metro: " + pName + " est\u00e1 com valor incorreto, favor verificar e tentar novamente."));
			}
		}
		return sqlQuery;
	}

	private Object prepareValue(Object pValue, String pType) throws JspException {
		try {
			pType = pType.trim();
			if ("INTEGER".equalsIgnoreCase(pType) || "DECIMAL".equalsIgnoreCase(pType)) {
				pValue = BigDecimalUtil.valueOf(pValue.toString());
			} else if ("DATE".equalsIgnoreCase(pType) || "DATEPERIOD".equalsIgnoreCase(pType) || "DATETIME".equalsIgnoreCase(pType)) {
				pValue = Timestamp.valueOf(pValue.toString());
			} else {
				pValue = pValue.toString();
			}
		} catch (Exception e) {
			throw (JspException) SKError.registry(TSLevel.ERROR, "CORE_E00073", new JspException("O Valor e/ou Tipo de par\u00e2metro passado na query est\u00e1 incorreto.\nValor: " + pValue + ";\nTipo: " + pType + ".\n" + e.getMessage()));
		}
		return pValue;
	}

	private String getSqlStatement() throws JspTagException, MissingResourceException {
		String sqlStatement = null;
		if (sql != null) {
			sqlStatement = sql;
		} else if (bodyContent != null) {
			sqlStatement = bodyContent.getString();
		}
		if (sqlStatement == null || sqlStatement.trim().length() == 0) {
			throw (JspTagException) SKError.registry(TSLevel.ERROR, "CORE_E00074", new JspTagException("Sql n\u00e3o definido"));
		}

		return sqlStatement;
	}

	@Override
	public void addSQLParameter(Object o) {
	}

	private static class DataAcess {
		private JdbcWrapper jdbc;
		private String command;
		private boolean canClose;

		private static void close(DataAcess da) {
			if (da != null && da.canClose) {
				JdbcWrapper.closeSession(da.jdbc);
			}
		}
	}
}
