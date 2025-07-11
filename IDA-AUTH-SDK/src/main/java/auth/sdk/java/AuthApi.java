package auth.sdk.java;

import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.models.DemographicsModel;
import auth.sdk.java.models.IdentityInfo;
import auth.sdk.java.utils.Config;
import auth.sdk.java.utils.ConfigLoader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class AuthApi {

    public static Config loadConfig(String path) {
        return new ConfigLoader().loadConfig();
    }

    public static Authenticator initializeAuthenticator(Config config) throws Exception {
        return new Authenticator(config, null);
    }

    public static Map<String, Object> loadUserData(String filepath) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(new File(filepath), Map.class);
    }

    public static UserValidationResult validateUserData(Map<String, Object> userData) {
        String language = (String) userData.get("language");
        if (language == null || language.isEmpty()) {
            throw new IllegalArgumentException("Missing 'language' field");
        }
        String individualId = ((String) userData.getOrDefault("individual_id", "")).trim();
        if (individualId.isEmpty()) {
            throw new IllegalArgumentException("Missing 'individual_id'");
        }
        String individualIdType = ((String) userData.getOrDefault("individual_id_type", "UIN")).trim();
        String dob = (String) userData.get("dob");
        if (dob != null && !dob.matches("\\d{4}/\\d{2}/\\d{2}$")) {
            throw new IllegalArgumentException("Invalid DOB format. Use YYYY/MM/DD");
        }
        return new UserValidationResult(language, individualId, individualIdType);
    }

    public static List<IdentityInfo> wrapLocalized(Object value, String language) {
        if (value == null) return Collections.emptyList();
        IdentityInfo info = new IdentityInfo();
        info.setLanguage(language);
        info.setValue(value.toString());
        return Collections.singletonList(info);
    }

    public static DemographicsModel prepareDemographics(Map<String, Object> userData, String language) {
        DemographicsModel demo = new DemographicsModel();
        if (userData.get("name") != null)
            demo.setName(wrapLocalized(userData.get("name"), language));
        if (userData.get("gender") != null)
            demo.setGender(wrapLocalized(userData.get("gender"), language));
        if (userData.get("full_address") != null)
            demo.setFullAddress(wrapLocalized(userData.get("full_address"), language));
        if (userData.get("dob") != null)
            demo.setDob(userData.get("dob").toString());
        if (userData.get("email_id") != null)
            demo.setEmailId(userData.get("email_id").toString());
        if (userData.get("phone_number") != null)
            demo.setPhoneNumber(userData.get("phone_number").toString());

        if (demo.getName().isEmpty() && demo.getGender().isEmpty() &&
                demo.getFullAddress().isEmpty() && (demo.getDob() == null || demo.getDob().isEmpty()) &&
                (demo.getEmailId() == null || demo.getEmailId().isEmpty()) &&
                (demo.getPhoneNumber() == null || demo.getPhoneNumber().isEmpty())) {
            throw new IllegalArgumentException("No valid demographic data provided.");
        }
        return demo;
    }

    public static JsonNode authenticateFromJsonFile(String jsonPath, String configPath) throws Exception {
        Config config = loadConfig(configPath);
        Authenticator authenticator = initializeAuthenticator(config);
        Map<String, Object> userData = loadUserData(jsonPath);
        UserValidationResult validation = validateUserData(userData);
        DemographicsModel demographics = prepareDemographics(userData, validation.language);

        Map<String, Object> response = authenticator.auth(
                validation.individualId,
                validation.individualIdType,
                demographics,
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                true
        );
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(response, JsonNode.class);
    }

    // Helper class for validation result
    public static class UserValidationResult {
        public final String language;
        public final String individualId;
        public final String individualIdType;

        public UserValidationResult(String language, String individualId, String individualIdType) {
            this.language = language;
            this.individualId = individualId;
            this.individualIdType = individualIdType;
        }
    }
}