package auth.sdk.java.exceptions;

public class AuthenticatorException extends Exception {
    private final String errorCode;
    private final String errorMessage;

    public AuthenticatorException(String errorCode, String errorMessage) {
        super(errorMessage);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}