package auth.sdk.java;

import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.utils.Config;
import auth.sdk.java.utils.ConfigLoader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Map;

public class GenerateOtpApi {


    public static Config loadConfig(String configPath) {

        ConfigLoader loader = new ConfigLoader();
        return loader.loadConfig();
    }

    public static Authenticator initializeAuthenticator(Config config) throws Exception {
        return new Authenticator(config, null);
    }

    public static JsonNode loadUserData(String userDataPath) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readTree(new File(userDataPath));
    }


    public static JsonNode generateOtp(String userDataPath, String configPath) throws Exception {
        JsonNode userData = loadUserData(userDataPath);
        Config config = loadConfig(configPath);
        Authenticator authenticator = initializeAuthenticator(config);

        Map<String, Object> response = authenticator.genOtp(
                userData.path("individual_id").asText(),
                userData.has("individual_id_type") ? userData.path("individual_id_type").asText() : "UIN",
                java.util.UUID.randomUUID().toString(),
                userData.has("email") && userData.get("email").asBoolean(),
                userData.has("phone") && userData.get("phone").asBoolean()
        );

        ObjectMapper mapper = new ObjectMapper();
        JsonNode responseNode = mapper.convertValue(response, JsonNode.class);

        if (responseNode.has("errors") && responseNode.get("errors").size() > 0) {
            StringBuilder errorMsg = new StringBuilder("OTP Generation failed: ");
            for (JsonNode error : responseNode.get("errors")) {
                errorMsg.append("(")
                        .append(error.get("errorCode").asText())
                        .append(", ")
                        .append(error.get("errorMessage").asText())
                        .append(") ");
            }
            throw new Exception(errorMsg.toString());
        }

        return responseNode;
    }
}