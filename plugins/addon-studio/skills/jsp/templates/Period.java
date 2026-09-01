package br.com.sankhya.<addon>.servlet.taglibs;

public class Period {

	String	INI;
	String	FIN;

	public String getINI() {
		return INI;
	}

	public void setINI(String iNI) {
		INI = iNI;
	}

	public String getFIN() {
		return FIN;
	}

	public void setFIN(String fIN) {
		FIN = fIN;
	}

	@Override
	public String toString() {
		return "Period [INI=" + INI + ", FIN=" + FIN + "]";
	}

}
