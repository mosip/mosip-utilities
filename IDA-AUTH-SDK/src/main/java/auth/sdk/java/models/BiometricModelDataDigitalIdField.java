package auth.sdk.java.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BiometricModelDataDigitalIdField {
    private String serialNo;
    private String make;
    private String model;
    private String type;
    private String deviceSubType;
    private String deviceProvider;
    private String dp;
    private String dpId;
    private String deviceProviderId;
    private String dateTime;

}