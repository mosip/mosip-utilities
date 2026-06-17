package auth.sdk.java.utils;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Config {

    private MosipAuth mosip_auth;

    private MosipAuthServer mosip_auth_server;

    private EncryptConfig crypto_encrypt;

    private SignConfig crypto_signature;


    @Getter
    @Setter
    public static class MosipAuth {

        private String partner_misp_lk;

        private String partner_id;

        private String partner_apikey;

        private String ida_auth_version;

        private String ida_auth_request_demo_id;

        private String ida_auth_request_kyc_id;

        private String ida_auth_request_otp_id;

        private String ida_auth_env;

        private String timestamp_format;

        private String authorization_header_constant;
    }

    @Getter
    @Setter
    public static class MosipAuthServer {

        private String ida_auth_url;

        private String ida_auth_domain_uri;
    }

    @Getter
    @Setter
    public static class EncryptConfig {

        private String encrypt_cert_path;

        private String decrypt_p12_file_path;

        private String decrypt_p12_file_password;

        private int symmetric_key_size;

        private int symmetric_nonce_size;

        private int symmetric_gcm_tag_size;
    }

    @Getter
    @Setter
    public static class SignConfig {
        private String sign_p12_file_path;

        private String sign_p12_file_password;

        private String algorithm;
    }
}