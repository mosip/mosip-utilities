package examples;

import auth.sdk.java.authenticator.Authenticator;
import auth.sdk.java.models.BiometricModel;
import auth.sdk.java.utils.ConfigLoader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

/**
 * Authenticates users using biometrics.
 * <p>
 * Usage: See {@link auth.sdk.java.authenticator.Authenticator}
 * </p>
 *
 * @author Tezaswa06
 * @version 1.0
 */

public class BiometricAuth {

    private static final String DEVICE_DISCOVERY_URL = "http://127.0.0.1:4501/device";
    private static final String BIOMETRIC_CAPTURE_URL = "http://127.0.0.1:4501/capture";
    private static final String USER_DATA_FILE = "C:/Users/Tezaswa/Desktop/IDA-AUTH-SDK/IDA-AUTH-SDK/UserData.json";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Authenticator authenticator;

    public BiometricAuth() throws Exception {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
        ConfigLoader configLoader = new ConfigLoader();
        this.authenticator = new Authenticator(configLoader.loadConfig(), null);
    }

    private String readIndividualId() throws IOException {
        File userDataFile = new File(USER_DATA_FILE);
        if (!userDataFile.exists()) {
            System.exit(1);
        }

        JsonNode data = objectMapper.readTree(userDataFile);
        String individualId = data.path("individual_id").asText();
        if (individualId.isEmpty()) {
            System.exit(1);
        }
        return individualId;
    }

    private List<JsonNode> discoverBiometricDevices() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(DEVICE_DISCOVERY_URL))
                    .method("MOSIPDISC", HttpRequest.BodyPublishers.ofString(
                            "{\"type\": \"Biometric Device\"}"
                    ))
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode devices = objectMapper.readTree(response.body());
                List<JsonNode> deviceList = new ArrayList<>();
                if (devices.isArray()) {
                    devices.elements().forEachRemaining(deviceList::add);
                    return deviceList;
                } else {
                    return new ArrayList<>();
                }
            } else {
                throw new RuntimeException("HTTP error: " + response.statusCode());
            }
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<JsonNode> captureBiometricData(JsonNode device) {
        try {
            ObjectNode payload = objectMapper.createObjectNode()
                    .put("env", "Developer")
                    .put("purpose", "Auth")
                    .put("specVersion", "0.9.5")
                    .put("timeout", "10000")
                    .put("domainUri", "hello")
                    .put("captureTime", "2025-04-29T07:39:26Z")
                    .put("transactionId", "SBI12");

            ArrayNode bioArray = payload.putArray("bio");
            ObjectNode bioData = bioArray.addObject()
                    .put("type", device.path("type").asText("Face"))
                    .put("count", "1")
                    .put("requestedScore", "40")
                    .put("deviceId", device.path("deviceId").asText("3"))
                    .put("deviceSubId", "0")                    .put("previousHash", "")
                    .putNull("bioSubType");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BIOMETRIC_CAPTURE_URL))
                    .method("CAPTURE", HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .header("Content-Type", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode result = objectMapper.readTree(response.body());
                JsonNode biometrics = result.path("biometrics");
                List<JsonNode> biometricList = new ArrayList<>();
                if (biometrics.isArray()) {
                    biometrics.elements().forEachRemaining(biometricList::add);
                }
                return biometricList;
            } else {
                throw new RuntimeException("HTTP error: " + response.statusCode());
            }
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<BiometricModel> collectBiometrics() throws Exception {
        List<JsonNode> devices = discoverBiometricDevices();
        List<Map<String, Object>> biometricsData = new ArrayList<>();

        for (JsonNode device : devices) {
            if (!device.path("deviceId").asText().equals("3")) {
                continue;
            }

            List<JsonNode> data = captureBiometricData(device);

            for (JsonNode bio : data) {
                if (!bio.has("data") || !bio.get("data").isTextual()) {
                    continue;
                }

                Map<String, Object> bioMap = new HashMap<>();
                bioMap.put("specVersion", "0.9.5");
                bioMap.put("data", bio.get("data").asText());
                bioMap.put("hash", bio.get("hash").asText());
                bioMap.put("sessionKey", bio.get("sessionKey").asText());
                bioMap.put("thumbprint", bio.get("thumbprint").asText());

                biometricsData.add(bioMap);
            }
        }

        List<BiometricModel> models = new ArrayList<>();
        for (Map<String, Object> bio : biometricsData) {
            try {
                BiometricModel model = new BiometricModel();
                model.setSpecVersion((String) bio.get("specVersion"));
                model.setData((String) bio.get("data"));
                model.setHash((String) bio.get("hash"));
                model.setSessionKey((String) bio.get("sessionKey"));
                model.setThumbprint((String) bio.get("thumbprint"));
                models.add(model);
            } catch (Exception e) {
                throw e;
            }
        }

        return models;
    }

    public void main() {
        try {
            String individualId = readIndividualId();

            List<BiometricModel> biometricModels = collectBiometrics();

            if (biometricModels.isEmpty()) {
                System.exit(1);
            }

            List<Map<String, Object>> biometricJsonData = new ArrayList<>();
            for (BiometricModel model : biometricModels) {
                Map<String, Object> bioMap = new HashMap<>();
                bioMap.put("specVersion", model.getSpecVersion());
                bioMap.put("data", model.getData());
                bioMap.put("hash", model.getHash());
                bioMap.put("sessionKey", model.getSessionKey());
                bioMap.put("thumbprint", model.getThumbprint());
                biometricJsonData.add(bioMap);
            }


            Map<String, Object> response = authenticator.auth(
                    individualId,
                    "UIN",
                    null, // demographics
                    Optional.empty(), // txnId
                    Optional.empty(), // otpValue
                    Optional.of(biometricModels), // Pass biometricModels directly
                    true // consentObtained
            );

            JsonNode resBody = objectMapper.valueToTree(response);


            if (resBody.has("errors")) {
                for (JsonNode err : resBody.path("errors")) {
                    System.out.println("Error: " + err.path("errorCode").asText() + " - " + err.path("errorMessage").asText());
                }
                System.exit(1);
            }



        } catch (Exception e) {
            System.err.println("Authentication error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    public static void main(String[] args) throws Exception {
        BiometricAuth auth = new BiometricAuth();
        auth.main();
    }
}