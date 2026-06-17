package examples;

import auth.sdk.java.models.DemographicsModel;
import auth.sdk.java.models.IdentityInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.utils.ConfigLoader;

import java.util.Map;
import java.util.Optional;

/**
 * Authenticates users using demographics.
 * <p>
 * Usage: See {@link auth.sdk.java.authenticator.Authenticator}
 * </p>
 *
 * @author Tezaswa06
 * @version 1.0
 */

public class DemoAuth {
    public static void main(String[] args) {
        try {

            ConfigLoader configLoader = new ConfigLoader();
            Authenticator authenticator = new Authenticator(configLoader.loadConfig(), null);
            DemographicsModel demographicsData = new DemographicsModel();
            demographicsData.setDob("1992/04/15");
            demographicsData.setEmailId("IdRepository_AddIdentity_UpdateCount_Vid_smoke_Pos@mosip.net");


            IdentityInfo nameInfo = new IdentityInfo();
            nameInfo.setLanguage("eng");
            nameInfo.setValue("TEST_FULLNAMEeng");
            demographicsData.getName().add(nameInfo);


            IdentityInfo genderInfo = new IdentityInfo();
            genderInfo.setLanguage("eng");
            genderInfo.setValue("MLE");
            demographicsData.getGender().add(genderInfo);

            // Set full address
//            IdentityInfo addressInfo = new IdentityInfo();
//            addressInfo.setLanguage("eng");
//            addressInfo.setValue("TEST_ADDRESSLINE1eng, TEST_ADDRESSLINE2eng, TEST_ADDRESSLINE3eng");
//            demographicsData.getFullAddress().add(addressInfo);

            demographicsData.setPhoneNumber("5241388238"); // Set phone number
            // Perform authentication
            Map<String, Object> response = authenticator.auth(
                    "2139125329", // individualId
                    "UIN",             // individualIdType
                    demographicsData  , // demographicData
                    Optional.empty(),   // txnId
                    Optional.empty(),   // otpValue
                    Optional.empty(),   // biometrics
                    true                // consentObtained
            );

            ObjectMapper mapper = new ObjectMapper();
            JsonNode responseNode = mapper.convertValue(response, JsonNode.class);

            System.out.println("Response: " + responseNode.toPrettyString());

        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}