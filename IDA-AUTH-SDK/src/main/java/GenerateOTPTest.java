

import auth.sdk.java.GenerateOtpApi;
import auth.sdk.java.OtpAuthApi;
import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.utils.Config;
import com.fasterxml.jackson.databind.JsonNode;

public class GenerateOTPTest {
    public static void main(String[] args) {
        String USER_DATA = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/UserData.json";
        String OTP_VALUES = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK//OtpData.json";
        String CONFIG_PATH = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/src/main/resources/config.properties";

        try {

            Config config = GenerateOtpApi.loadConfig(CONFIG_PATH);
            Authenticator authenticator = GenerateOtpApi.initializeAuthenticator(config);


            JsonNode response = GenerateOtpApi.generateOtp(
                    USER_DATA,
                    CONFIG_PATH
            );


            System.out.println(response.toPrettyString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}