import auth.sdk.java.AuthApi;
import com.fasterxml.jackson.databind.JsonNode;

public class KycMain {
    public static void main(String[] args) {
        try {
            // Adjust these paths as needed
            String USER_DATA = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/UserData.json";
            String CONFIG_PATH = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/src/main/resources/config.properties";

            JsonNode response = performKycFromJsonFile(USER_DATA, CONFIG_PATH);

            System.out.println("KYC Decrypted Response:");
            System.out.println(response.toPrettyString());
        } catch (Exception e) {
            System.out.println("KYC process failed with error:");
            e.printStackTrace();
        }
    }

    public static JsonNode performKycFromJsonFile(String jsonPath, String configPath) throws Exception {
        return AuthApi.authenticateFromJsonFile(jsonPath, configPath);
    }
}
