

import auth.sdk.java.AuthApi;
import com.fasterxml.jackson.databind.JsonNode;

public class DemoAuthTest {
    public static void main(String[] args) {
        try {
            String USER_DATA = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/UserData.json";
            String CONFIG_PATH = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/src/main/resources/config.properties";

            JsonNode result = AuthApi.authenticateFromJsonFile(USER_DATA, CONFIG_PATH);
            System.out.println(result.toPrettyString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}