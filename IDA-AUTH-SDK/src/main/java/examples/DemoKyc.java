package examples;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.models.DemographicsModel;
import auth.sdk.java.models.IdentityInfo;
import auth.sdk.java.utils.ConfigLoader;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

/**
 * Authenticates users using kyc.
 * <p>
 * Usage: See {@link auth.sdk.java.authenticator.Authenticator}
 * </p>
 *
 * @author Tezaswa06
 * @version 1.0
 */

public class DemoKyc {
    public static void main(String[] args) {
        try {

            ConfigLoader configLoader = new ConfigLoader();
            Authenticator authenticator = new Authenticator(configLoader.loadConfig(), null);
            ObjectMapper objectMapper = new ObjectMapper();


            IdentityInfo nameInfo = new IdentityInfo();
            nameInfo.setLanguage("eng");
            nameInfo.setValue("TEST_FULLNAMEeng");

            DemographicsModel demographicsData = new DemographicsModel();
            demographicsData.setName(Collections.singletonList(nameInfo));




            String txnId = "1234567890"; // Example transaction ID
            Object kycResponse = authenticator.kyc(
                    txnId,                              // txnId
                    "2139125329",                       // individual_id
                    "UIN",                              // individual_id_type
                    Optional.of(demographicsData),      // demographic_data
                    Optional.empty(),                   // otpValue
                    Optional.empty(),                   // biometrics
                    true                                // consent
            );

            JsonNode response = objectMapper.valueToTree(kycResponse);

            Map<String, Object> decryptedResponse = authenticator.decryptResponse(objectMapper.convertValue(response, Map.class));


            if (response != null && response.has("errors")) {
                JsonNode errors = response.get("errors");
                for (JsonNode error : errors) {
                    System.out.println(error.get("errorCode").asText() + " : " + error.get("errorMessage").asText());
                }
                System.exit(1);
            }


        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
