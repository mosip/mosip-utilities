package auth.sdk.java;

import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.models.DemographicsModel;
import auth.sdk.java.models.IdentityInfo;
import auth.sdk.java.utils.Config;
import auth.sdk.java.utils.ConfigLoader;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.*;

public class KycAuthApi {
    public static Config loadConfig(String path) {
        return new ConfigLoader().loadConfig();
    }

    public static Map<String, Object> loadUserData(String filepath) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(new File(filepath), Map.class);
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
            throw new IllegalArgumentException("No valid demographic data found in user_data.json.");
        }
        return demo;
    }

    public static void performKycFromJsonFile(String jsonPath, String configPath) throws Exception {
        Config config = loadConfig(configPath);
        Authenticator authenticator = new Authenticator(config, null);

        Map<String, Object> userData = loadUserData(jsonPath);

        String individualId = ((String) userData.getOrDefault("individual_id", "")).trim();
        if (individualId.isEmpty()) throw new IllegalArgumentException("Missing 'individual_id'.");

        String language = ((String) userData.getOrDefault("language", "eng")).trim();
        String individualIdType = ((String) userData.getOrDefault("individual_id_type", "")).trim();
        if (individualIdType.isEmpty()) {
            individualIdType = (individualId.length() == 10) ? "UIN" : "VID";
        }

        DemographicsModel demographics = prepareDemographics(userData, language);

        Map<String, Object> response = authenticator.kyc(
                UUID.randomUUID().toString(), // txnId
                individualId,
                individualIdType,
                Optional.of(demographics),
                Optional.empty(),
                Optional.empty(),
                true
        );

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> responseBody = mapper.convertValue(response, Map.class);

        if (responseBody.containsKey("errors")) {
            List<Map<String, Object>> errors = (List<Map<String, Object>>) responseBody.get("errors");
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> error : errors) {
                sb.append(error.get("errorCode")).append(" : ").append(error.get("errorMessage")).append("\n");
            }
            throw new IllegalArgumentException(sb.toString());
        }

        Map<String, Object> decrypted = authenticator.decryptResponse(responseBody);
        System.out.println("Decrypted response: " + mapper.writeValueAsString(decrypted));
    }

}