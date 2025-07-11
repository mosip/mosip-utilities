package auth.sdk.java.models;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class MOSIPAuthRequest {
    private String id;
    private String version;
    private String individualId;
    private String individualIdType;
    private String transactionID;
    private String requestTime;
    private String specVersion;
    private String thumbprint;
    private String domainUri;
    private String env;
    private MOSIPRequestedAuth requestedAuth = new MOSIPRequestedAuth();
    private boolean consentObtained;
    private String requestHMAC;
    private String requestSessionKey;
    private String request;
    private Map<String, Object> metadata;

    public String toJson() {
        try {
            return new ObjectMapper().writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting object to JSON", e);
        }
    }
}