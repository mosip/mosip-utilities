package auth.sdk.java.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class ConfigLoader {
    private static final String CONFIG_FILE_PATH = "./src/main/resources/config.properties";

    public Config loadConfig() {
        Properties properties = new Properties();
        try (FileInputStream fis = new FileInputStream(CONFIG_FILE_PATH)) {
            properties.load(fis);
        } catch (IOException e) {
            throw new IllegalArgumentException("Configuration file not found or invalid at: " + CONFIG_FILE_PATH, e);
        }

        Config config = new Config();

        // Load mosip_auth section
        Config.MosipAuth mosipAuth = new Config.MosipAuth();
        mosipAuth.setTimestamp_format(properties.getProperty("mosip_auth.timestamp_format"));
        mosipAuth.setIda_auth_version(properties.getProperty("mosip_auth.ida_auth_version"));
        mosipAuth.setIda_auth_request_demo_id(properties.getProperty("mosip_auth.ida_auth_request_demo_id"));
        mosipAuth.setIda_auth_request_kyc_id(properties.getProperty("mosip_auth.ida_auth_request_kyc_id"));
        mosipAuth.setIda_auth_request_otp_id(properties.getProperty("mosip_auth.ida_auth_request_otp_id"));
        mosipAuth.setIda_auth_env(properties.getProperty("mosip_auth.ida_auth_env"));
        mosipAuth.setAuthorization_header_constant(properties.getProperty("mosip_auth.authorization_header_constant"));
        mosipAuth.setPartner_apikey(properties.getProperty("mosip_auth.partner_apikey"));
        mosipAuth.setPartner_misp_lk(properties.getProperty("mosip_auth.partner_misp_lk"));
        mosipAuth.setPartner_id(properties.getProperty("mosip_auth.partner_id"));
        config.setMosip_auth(mosipAuth);

        // Load mosip_auth_server section
        Config.MosipAuthServer mosipAuthServer = new Config.MosipAuthServer();
        mosipAuthServer.setIda_auth_domain_uri(properties.getProperty("mosip_auth_server.ida_auth_domain_uri"));
        mosipAuthServer.setIda_auth_url(properties.getProperty("mosip_auth_server.ida_auth_url"));
        config.setMosip_auth_server(mosipAuthServer);

        // Load crypto_encrypt section
        Config.EncryptConfig encryptConfig = new Config.EncryptConfig();
        encryptConfig.setSymmetric_key_size(Integer.parseInt(properties.getProperty("crypto_encrypt.symmetric_key_size")));
        encryptConfig.setSymmetric_nonce_size(Integer.parseInt(properties.getProperty("crypto_encrypt.symmetric_nonce_size")));
        encryptConfig.setSymmetric_gcm_tag_size(Integer.parseInt(properties.getProperty("crypto_encrypt.symmetric_gcm_tag_size")));
        encryptConfig.setEncrypt_cert_path(properties.getProperty("crypto_encrypt.encrypt_cert_path"));
        encryptConfig.setDecrypt_p12_file_path(properties.getProperty("crypto_encrypt.decrypt_p12_file_path"));
        encryptConfig.setDecrypt_p12_file_password(properties.getProperty("crypto_encrypt.decrypt_p12_file_password"));
        config.setCrypto_encrypt(encryptConfig);

        // Load crypto_signature section
        Config.SignConfig signConfig = new Config.SignConfig();
        signConfig.setAlgorithm(properties.getProperty("crypto_signature.algorithm"));
        signConfig.setSign_p12_file_path(properties.getProperty("crypto_signature.sign_p12_file_path"));
        signConfig.setSign_p12_file_password(properties.getProperty("crypto_signature.sign_p12_file_password"));
        config.setCrypto_signature(signConfig);

        return config;
    }
}
