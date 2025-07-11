package auth.sdk.java.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MOSIPBaseRequest {
    private String id;
    private String version;
    private String individualId;
    private String individualIdType;
    private String transactionID;
    private String requestTime;

    // Getters and Setters
}
