package auth.sdk.java.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BiometricModel {
    private String data;
    private String hash;
    private String sessionKey;
    private String specVersion;
    private String thumbprint;

}
