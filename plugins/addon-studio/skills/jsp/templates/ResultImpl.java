package br.com.sankhya.<addon>.servlet.taglibs;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

import javax.servlet.jsp.jstl.sql.Result;

public class ResultImpl implements Result {
	private List		rowMap;
	private List		rowByIndex;
	private String[]	columnNames;
	private boolean		isLimited;

	public ResultImpl(ResultSet rs, int startRow, int maxRows) throws SQLException {
		rowMap = new ArrayList();
		rowByIndex = new ArrayList();

		ResultSetMetaData rsmd = rs.getMetaData();
		int noOfColumns = rsmd.getColumnCount();

		// Create the column name array
		columnNames = new String[noOfColumns];
		for (int i = 1; i <= noOfColumns; i++) {
			columnNames[i - 1] = rsmd.getColumnName(i);
		}

		// Throw away all rows upto startRow
		for (int i = 0; i < startRow; i++) {
			rs.next();
		}

		// Process the remaining rows upto maxRows
		int processedRows = 0;
		while (rs.next()) {
			if ((maxRows != -1) && (processedRows == maxRows)) {
				isLimited = true;
				break;
			}
			Object[] columns = new Object[noOfColumns];
			SortedMap columnMap = new TreeMap(String.CASE_INSENSITIVE_ORDER);

			// JDBC uses 1 as the lowest index!
			for (int i = 1; i <= noOfColumns; i++) {
				Object value = rs.getObject(i);
				if (rs.wasNull()) {
					value = null;
				}
				columns[i - 1] = value;
				columnMap.put(columnNames[i - 1], value);
			}
			rowMap.add(columnMap);
			rowByIndex.add(columns);
			processedRows++;
		}
	}

	public SortedMap[] getRows() {
		if (rowMap == null) {
			return null;
		}

		//should just be able to return SortedMap[] object
		return (SortedMap[]) rowMap.toArray(new SortedMap[0]);
	}

	public Object[][] getRowsByIndex() {
		if (rowByIndex == null) {
			return null;
		}

		//should just be able to return Object[][] object
		return (Object[][]) rowByIndex.toArray(new Object[0][0]);
	}

	public String[] getColumnNames() {
		return columnNames;
	}

	public int getRowCount() {
		if (rowMap == null) {
			return -1;
		}
		return rowMap.size();
	}

	public boolean isLimitedByMaxRows() {
		return isLimited;
	}

}
