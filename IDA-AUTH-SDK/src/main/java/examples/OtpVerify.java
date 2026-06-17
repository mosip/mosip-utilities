package examples;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.models.DemographicsModel;
import auth.sdk.java.models.BiometricModel;
import auth.sdk.java.utils.ConfigLoader;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

/**
 * Authenticates users using otp.
 * <p>
 * Usage: See {@link auth.sdk.java.authenticator.Authenticator}
 * </p>
 *
 * @author Tezaswa06
 * @version 1.0
 */

public class OtpVerify {
    public static void main(String[] args) {
        try {

            ConfigLoader configLoader = new ConfigLoader();
            Authenticator authenticator = new Authenticator(configLoader.loadConfig(), null);

            Map<String, Object> response = authenticator.auth(
                    "2139125329", // individualId
                    "UIN",             // individualIdType
                    null , // demographicData
                    Optional.of("1234567890"),   // txnId
                    Optional.of("111111"),   // otpValue
                    Optional.empty(),   // biometrics
                    true                // consentObtained
            );

            ObjectMapper mapper = new ObjectMapper();
            JsonNode responseNode = mapper.convertValue(response, JsonNode.class);


            if (responseNode.has("errors")) {
                for (JsonNode error : responseNode.get("errors")) {
                    System.out.println(error.get("errorCode").asText() + " : " + error.get("errorMessage").asText());
                }
                System.exit(1);
            }

            Map<String, Object> decryptedResponse = authenticator.decryptResponse(response);

        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}