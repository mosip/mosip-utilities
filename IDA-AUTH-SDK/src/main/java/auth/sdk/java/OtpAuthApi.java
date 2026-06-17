package auth.sdk.java;

import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.utils.Config;
import auth.sdk.java.utils.ConfigLoader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Map;

public class OtpAuthApi {

    public static Config loadConfig(String configPath) {
        ConfigLoader loader = new ConfigLoader();
        return loader.loadConfig();
    }

    public static Authenticator initializeAuthenticator(Config config) throws Exception {
        return new Authenticator(config, null);
    }

    public static JsonNode loadOtpData(String filepath) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readTree(new File(filepath));
    }

    public static JsonNode loadUserData(String userDataPath) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readTree(new File(userDataPath));
    }

    public static OtpValidationResult validateOtpData(JsonNode otpData) {
        String individualId = otpData.path("individual_id").asText().trim();
        String otpValue = otpData.path("otp_value").asText().trim();
        String txnId = otpData.path("txn_id").asText().trim();

        if (individualId.isEmpty() || otpValue.isEmpty() || txnId.isEmpty()) {
            throw new IllegalArgumentException("Missing required field(s): individual_id, otp_value, or txn_id.");
        }

        String individualIdType = (individualId.length() == 10) ? "UIN" : "VID";
        return new OtpValidationResult(individualId, otpValue, txnId, individualIdType);
    }

    public static JsonNode authenticateUserWithOtp(
            Authenticator authenticator,
            String userDataPath,
            String otpDataPath,
            String configPath
    ) throws Exception {

        Config config = loadConfig(configPath);
        authenticator = initializeAuthenticator(config);
        JsonNode userData = loadUserData(userDataPath);
        JsonNode otpData = loadOtpData(otpDataPath);

        System.out.println("User Data: " + userData.toPrettyString());
        System.out.println("OTP Data: " + otpData.toPrettyString());
        Map<String, Object> response = authenticator.auth(

                userData.path("individual_id").asText(),
                userData.has("individual_id_type") ? userData.path("individual_id_type").asText() : "UIN",
                null,
                java.util.Optional.of(otpData.path("txn_id").asText()),
                java.util.Optional.of(otpData.path("otp").asText()),
                java.util.Optional.empty(),
                true
        );

        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(response, JsonNode.class);
    }

    public static class OtpValidationResult {
        public final String individualId;
        public final String otpValue;
        public final String txnId;
        public final String individualIdType;

        public OtpValidationResult(String individualId, String otpValue, String txnId, String individualIdType) {
            this.individualId = individualId;
            this.otpValue = otpValue;
            this.txnId = txnId;
            this.individualIdType = individualIdType;
        }
    }
}