package auth.sdk.java.authenticator;

import auth.sdk.java.models.*;
import auth.sdk.java.utils.Config;
import auth.sdk.java.utils.CryptoUtil;
import auth.sdk.java.utils.RestUtil;
import auth.sdk.java.exceptions.AuthenticatorCryptoException;
import auth.sdk.java.exceptions.AuthenticatorException;
import auth.sdk.java.exceptions.Errors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Utility class for making HTTP requests (GET, POST, etc.) with support for custom headers, cookies, and payloads.
 * <p>
 * This class provides methods to:
 * <ul>
 *   <li>Send HTTP requests with configurable headers and cookies</li>
 *   <li>Handle response codes and error handling</li>
 *   <li>Support for JSON and other content types</li>
 * </ul>
 * <b>Usage:</b> Used internally by the SDK for communication with external services.
 * </p>
 *
 * @author Tezaswa06
 * @version 1.0
 */

public class Authenticator {
    private final Logger logger;
    private final java.util.logging.Logger julLogger;
    private final RestUtil authRestUtil;
    private final CryptoUtil cryptoUtil;
    private final String authDomainScheme;
    private final String partnerMispLk;
    private final String partnerId;
    private final String partnerApikey;
    private final String idaAuthVersion;
    private final Map<String, String> idaAuthRequestIdByController;
    private final String idaAuthEnv;
    private final String timestampFormat;
    private final String authorizationHeaderConstant;

    public Authenticator(Config config, Logger customLogger) throws Exception {
        this.logger = customLogger != null ? customLogger : initLogger(config);
        this.julLogger = java.util.logging.Logger.getLogger(Authenticator.class.getName());
        this.authRestUtil = new RestUtil(
                config.getMosip_auth_server().getIda_auth_url(),
                config.getMosip_auth().getAuthorization_header_constant(),
                this.julLogger
        );
        this.cryptoUtil = new CryptoUtil(
                config.getCrypto_encrypt(),
                config.getCrypto_signature(),
                this.logger
        );
        this.authDomainScheme = config.getMosip_auth_server().getIda_auth_domain_uri();
        this.partnerMispLk = config.getMosip_auth().getPartner_misp_lk();
        this.partnerId = config.getMosip_auth().getPartner_id();
        this.partnerApikey = config.getMosip_auth().getPartner_apikey();
        this.idaAuthVersion = config.getMosip_auth().getIda_auth_version();

        this.idaAuthRequestIdByController = new HashMap<>();
        this.idaAuthRequestIdByController.put("auth", config.getMosip_auth().getIda_auth_request_demo_id());
        this.idaAuthRequestIdByController.put("kyc", config.getMosip_auth().getIda_auth_request_kyc_id());
        this.idaAuthRequestIdByController.put("otp", config.getMosip_auth().getIda_auth_request_otp_id());

        this.idaAuthEnv = config.getMosip_auth().getIda_auth_env();
        this.timestampFormat = config.getMosip_auth().getTimestamp_format();
        this.authorizationHeaderConstant = config.getMosip_auth().getAuthorization_header_constant();

    }


    public Map<String, Object> genOtp(
            String individualId,
            String individualIdType,
            String txnId,
            boolean email ,
            boolean phone
    ) throws Exception {
        List<String> channels = new ArrayList<>();
        if (email) channels.add("EMAIL");
        if (phone) channels.add("PHONE");

        if (channels.isEmpty()) {
            logger.error(Errors.AUT_OTP_001.getMessage());
            throw new AuthenticatorException(Errors.AUT_OTP_001.name(), Errors.AUT_OTP_001.getMessage());
        }

        MOSIPOtpRequest request = (MOSIPOtpRequest) getDefaultAuthRequest(
                "otp",
                null,
                txnId,
                individualId,
                individualIdType
        );
        request.setOtpChannel(channels);

        String pathParams = String.join("/",
                URLEncoder.encode("otp", StandardCharsets.UTF_8),
                URLEncoder.encode(partnerMispLk, StandardCharsets.UTF_8),
                URLEncoder.encode(partnerId, StandardCharsets.UTF_8),
                URLEncoder.encode(partnerApikey, StandardCharsets.UTF_8)
        );

        String fullRequestJson = request.toJson();
        logger.debug("fullRequestJson=" + fullRequestJson);

        Map<String, String> signatureHeader;
        try {
            signatureHeader = Collections.singletonMap("Signature", cryptoUtil.signAuthRequestData(fullRequestJson));
        } catch (AuthenticatorCryptoException e) {
            logger.error("Failed to Encrypt Auth Data. Error Message: " + e.getMessage());
            throw e;
        }

        logger.debug("Posting to " + pathParams);

        HttpURLConnection connection = authRestUtil.postRequest(
                pathParams,
                signatureHeader,
                fullRequestJson,
                null
        );

        try (InputStream is = connection.getInputStream()) {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(is, new TypeReference<Map<String, Object>>() {});
        }
    }

    public Map<String, Object> auth(
            String individualId,
            String individualIdType,
            DemographicsModel demographicData,
            Optional<String> txnId,
            Optional<String> otpValue,
            Optional<List<BiometricModel>> biometrics,
            boolean consentObtained
    ) throws Exception {


        String transactionId = txnId.orElse(UUID.randomUUID().toString());
        String otp = otpValue.orElse(null);
        List<BiometricModel> biometricList = biometrics.orElse(Collections.emptyList());

        return authenticate("auth", individualId, individualIdType, demographicData, otp, biometricList, consentObtained, transactionId);
    }

    public Map<String, Object> kyc(
            String txnId,
            String individualId,
            String individualIdType,
            Optional<DemographicsModel> demographicData,
            Optional<String> otpValue,
            Optional<List<BiometricModel>> biometrics,
            boolean consentObtained
    ) throws Exception {
        // Use default values if Optional parameters are empty
        DemographicsModel resolvedDemographicData = demographicData.orElse(null);
        String resolvedOtpValue = otpValue.orElse(null);
        List<BiometricModel> resolvedBiometrics = biometrics.orElse(Collections.emptyList());

        // Call the authenticate method with resolved parameters
        return authenticate(
                "kyc",
                individualId,
                individualIdType,
                resolvedDemographicData,
                resolvedOtpValue,
                resolvedBiometrics,
                consentObtained,
                txnId
        );
    }

    public Map<String, Object> decryptResponse(Map<String, Object> responseBody) throws Exception {
        try {
            if (!responseBody.containsKey("response")) {
                throw new IllegalArgumentException("Response body does not contain 'response' key");
            }

            Map<String, Object> response = (Map<String, Object>) responseBody.get("response");
            String sessionKeyB64 = (String) response.get("sessionKey");
            String identityB64 = (String) response.get("identity");

            if (sessionKeyB64 == null || sessionKeyB64.isEmpty() || identityB64 == null || identityB64.isEmpty()) {
                throw new IllegalArgumentException("Response does not contain 'sessionKey' or 'identity'");
            }

            return cryptoUtil.decryptAuthData(sessionKeyB64, identityB64);
        } catch (Exception e) {
            logger.error("Error decrypting response: {}", e.getMessage(), e);
            throw e;
        }
    }

    private static void validateConfig(Config config) {
        if (config.getMosip_auth_server() == null) {
            throw new IllegalArgumentException("Config should have a [mosip_auth_server] section");
        }
        if (config.getMosip_auth_server().getIda_auth_url() == null) {
            throw new IllegalArgumentException("Config should have 'ida_auth_url' set under [mosip_auth_server] section");
        }
        if (config.getMosip_auth_server().getIda_auth_domain_uri() == null) {
            throw new IllegalArgumentException("Config should have 'ida_auth_domain_uri' set under [mosip_auth_server] section");
        }
    }

    private static Logger initLogger(Config config) {
        Logger logger = LoggerFactory.getLogger(Authenticator.class);
        return logger;
    }

    private MOSIPBaseRequest getDefaultBaseRequest(String controller, String timestamp, String txnId, String individualId, String individualIdType) {
        String timestampStr = (timestamp == null || timestamp.isEmpty())
                ? DateTimeFormatter.ofPattern(timestampFormat).withZone(ZoneOffset.UTC).format(Instant.now())
                : timestamp;

        String transactionId = String.valueOf(1234567890);

        String id = idaAuthRequestIdByController.get(controller);
        if (id == null || id.isEmpty()) {
            String errMsg = Errors.AUT_CRY_005.getMessage(controller, String.join(" | ", idaAuthRequestIdByController.keySet()));
            logger.error("No id found for controller: " + controller);
            throw new IllegalArgumentException(errMsg);
        }

        MOSIPBaseRequest baseRequest = new MOSIPBaseRequest();
        baseRequest.setId(id);
        baseRequest.setVersion(idaAuthVersion);
        baseRequest.setIndividualId(individualId);
        baseRequest.setIndividualIdType(individualIdType);
        baseRequest.setTransactionID(transactionId);
        baseRequest.setRequestTime(timestampStr);
        return baseRequest;
    }

    private Object getDefaultAuthRequest(String controller, String timestamp, String txnId, String individualId, String individualIdType) throws Exception {
        MOSIPBaseRequest baseRequest = getDefaultBaseRequest(controller, timestamp, txnId, individualId, individualIdType);

        if ("otp".equalsIgnoreCase(controller)) {
            MOSIPOtpRequest otpRequest = new MOSIPOtpRequest();
            otpRequest.setId(baseRequest.getId());
            otpRequest.setVersion(baseRequest.getVersion());
            otpRequest.setIndividualId(baseRequest.getIndividualId());
            otpRequest.setIndividualIdType(baseRequest.getIndividualIdType());
            otpRequest.setTransactionID(baseRequest.getTransactionID());
            otpRequest.setRequestTime(baseRequest.getRequestTime());
            otpRequest.setOtpChannel(Collections.emptyList());
            otpRequest.setMetadata(Collections.emptyMap());
            return otpRequest;
        }

        MOSIPAuthRequest authRequest = new MOSIPAuthRequest();
        authRequest.setId(baseRequest.getId());
        authRequest.setVersion(baseRequest.getVersion());
        authRequest.setIndividualId(baseRequest.getIndividualId());
        authRequest.setIndividualIdType(baseRequest.getIndividualIdType());
        authRequest.setTransactionID(baseRequest.getTransactionID());
        authRequest.setRequestTime(baseRequest.getRequestTime());
        authRequest.setSpecVersion(idaAuthVersion);
        authRequest.setThumbprint(cryptoUtil.getEncCertThumbprint());
        authRequest.setDomainUri(authDomainScheme);
        authRequest.setEnv(idaAuthEnv);
        authRequest.setRequest("");
        authRequest.setConsentObtained(true);
        authRequest.setRequestHMAC("");
        authRequest.setRequestSessionKey("");
        authRequest.setMetadata(Collections.emptyMap());
        return authRequest;
    }

    private Map<String, Object> authenticate(String controller, String individualId, String individualIdType, DemographicsModel demographicData,
                                             String otpValue, List<BiometricModel> biometrics, boolean consentObtained, String txnId) throws Exception {
        logger.info("Received Auth Request for demographic.");

        MOSIPAuthRequest authRequest = (MOSIPAuthRequest) getDefaultAuthRequest(controller, null, txnId, individualId, individualIdType);

        MOSIPEncryptAuthRequest request = new MOSIPEncryptAuthRequest();
        request.setTimestamp(authRequest.getRequestTime());
        request.setBiometrics(biometrics != null ? biometrics : Collections.emptyList());
        request.setDemographics(demographicData);
        request.setOtp(otpValue);
        try {
            String[] encryptedData = cryptoUtil.encryptAuthData(request.toJson().getBytes(StandardCharsets.UTF_8));
            authRequest.setRequest(encryptedData[0]);
            authRequest.setRequestSessionKey(encryptedData[1]);
            authRequest.setRequestHMAC(encryptedData[2]);

        } catch (AuthenticatorCryptoException exp) {
            logger.error("Failed to Encrypt Auth Data. Error Message: {}", exp.getMessage());
            throw exp;
        }

        String pathParams = String.join("/",
                URLEncoder.encode(controller, StandardCharsets.UTF_8),
                URLEncoder.encode(partnerMispLk, StandardCharsets.UTF_8),
                URLEncoder.encode(partnerId, StandardCharsets.UTF_8),
                URLEncoder.encode(partnerApikey, StandardCharsets.UTF_8)
        );

        String fullRequestJson = authRequest.toJson();
        logger.debug("fullRequestJson={}", fullRequestJson);

        Map<String, String> signatureHeader;
        try {
            signatureHeader = Map.of("Signature", cryptoUtil.signAuthRequestData(fullRequestJson));

        } catch (AuthenticatorCryptoException exp) {
            logger.error("Failed to Sign Auth Data. Error Message: {}", exp.getMessage());
            throw exp;
        }

        HttpURLConnection connection = authRestUtil.postRequest(
                pathParams,
                signatureHeader,
                fullRequestJson,
                null
        );

        Map<String, Object> response;
        try (InputStream is = connection.getInputStream()) {
            ObjectMapper mapper = new ObjectMapper();
            response = mapper.readValue(is, new TypeReference<Map<String, Object>>() {});

        } catch (IOException e) {
            InputStream es = connection.getErrorStream();
            if (es != null) {
                String errorResponse = new String(es.readAllBytes(), StandardCharsets.UTF_8);
                System.err.println("Server error response: " + errorResponse);
            }
            throw e;
        }
        logger.info("Auth Request for Demographic Completed.");
        return response;
    }
}