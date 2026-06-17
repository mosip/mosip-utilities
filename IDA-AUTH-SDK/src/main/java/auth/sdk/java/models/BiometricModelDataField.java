package auth.sdk.java.models;

import auth.sdk.java.models.BiometricModelDataDigitalIdField;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BiometricModelDataField {
    private BiometricModelDataDigitalIdField digitalId;
    private String bioType;
    private String bioSubType;
    private String bioValue;
    private String deviceCode;
    private String deviceServiceVersion;
    private String transactionId;
    private String timestamp;
    private String purpose;
    private String env;
    private String version;
    private String domainUri;
    private int requestedScore;
    private int qualityScore;

}