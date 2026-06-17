package auth.sdk.java.exceptions;

public class AuthenticatorCryptoException extends Exception {
    private final String errorCode;
    private final String errorMessage;

    public AuthenticatorCryptoException(String errorCode, String errorMessage) {
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