package auth.sdk.java.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MOSIPRequestedAuth {
    private boolean demo = false;
    private boolean pin = false;
    private boolean otp = false;
    private boolean bio = false;

    // Getters and Setters
}