import auth.sdk.java.OtpAuthApi;
import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.utils.Config;
import com.fasterxml.jackson.databind.JsonNode;

public class VerifyOTPTest {
    public static void main(String[] args) {
        String USER_DATA = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/UserData.json";
        String OTP_VALUES = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK//OtpData.json";
        String CONFIG_PATH = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/src/main/resources/config.properties";

        try {

            Config config = OtpAuthApi.loadConfig(CONFIG_PATH);
            Authenticator authenticator = OtpAuthApi.initializeAuthenticator(config);


            JsonNode response = OtpAuthApi.authenticateUserWithOtp(
                    authenticator,
                    USER_DATA,
                    OTP_VALUES,
                    CONFIG_PATH
            );


            System.out.println(response.toPrettyString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}