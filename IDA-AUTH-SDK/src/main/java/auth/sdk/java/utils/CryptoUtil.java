package auth.sdk.java.utils;

/**
 * Utility class for cryptographic operations such as encryption, decryption,
 * signing, and certificate handling for the MOSIP authentication SDK.
 * <p>
 * This class provides methods to:
 * <ul>
 *   <li>Encrypt and decrypt authentication data using symmetric and asymmetric keys</li>
 *   <li>Sign authentication requests</li>
 *   <li>Handle certificate thumbprints and key loading</li>
 * </ul>
 * <b>Usage:</b> Used internally by the {@link auth.sdk.java.authenticator.Authenticator} class.
 * </p>
 *
 * @author Tezaswa06
 * @version 1.0
 */

import auth.sdk.java.exceptions.AuthenticatorCryptoException;
import auth.sdk.java.exceptions.Errors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.util.Base64URL;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.Hex;
import org.slf4j.Logger;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

public class CryptoUtil {
    private static final String HASH_ALGO = "SHA-256";
    private static final String RSA_ALGO = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private static final String MGF1 = "MGF1";
    private final Logger logger;
    private final RSAPublicKey encryptPublicKey;
    private final RSAPrivateKey decryptPrivateKey;
    private final RSAPrivateKey signPrivateKey;
    private final X509Certificate signCert;
    private final String algorithm;
    private final int symmetricKeySize;
    private final String encCertThumbprint;
    private final JWK signPrivKeyJws;

    public CryptoUtil(Config.EncryptConfig encryptConfig, Config.SignConfig signConfig, Logger logger) throws Exception {
        this.logger = logger;

        // Load encryption certificate
        this.encryptPublicKey = (RSAPublicKey) getCertificateObj(encryptConfig.getEncrypt_cert_path(), logger).getPublicKey();

        // Load decryption private key
        Object[] decryptKeyStoreData = getPrivateKeyAndCertificate(
                encryptConfig.getDecrypt_p12_file_path(),
                encryptConfig.getDecrypt_p12_file_password(),
                this.logger
        );
        this.decryptPrivateKey = (RSAPrivateKey) decryptKeyStoreData[0];

        // Load signing private key and certificate
        Object[] signKeyStoreData = getPrivateKeyAndCertificate(
                signConfig.getSign_p12_file_path(),
                signConfig.getSign_p12_file_password(),
                this.logger
        );
        this.signPrivateKey = (RSAPrivateKey) signKeyStoreData[0];
        this.signCert = (X509Certificate) signKeyStoreData[1];

        // Initialize signPrivKeyJws
        this.signPrivKeyJws = CryptoUtil.getJwkPrivateKey(this.signPrivateKey, signConfig.getSign_p12_file_password(), this.logger);

        // Symmetric encryption parameters
        this.symmetricKeySize = encryptConfig.getSymmetric_key_size();

        // Calculate the thumbprint of the encryption certificate
        this.encCertThumbprint = calculateEncCertThumbprint(encryptConfig.getEncrypt_cert_path());

        // Signing algorithm
        this.algorithm = signConfig.getAlgorithm();
    }

    private static X509Certificate getCertificateObj(String certPath, Logger logger) throws AuthenticatorCryptoException {
        logger.info("Creating certificate object for the file path: {}", certPath);
        try (FileInputStream fis = new FileInputStream(certPath)) {
            CertificateFactory factory = CertificateFactory.getInstance("X.509");
            return (X509Certificate) factory.generateCertificate(fis);
        } catch (Exception e) {
            logger.error("Error reading certificate file. Error Message: {}", e.getMessage(), e);
            throw new AuthenticatorCryptoException(Errors.AUT_CRY_001.name(), Errors.AUT_CRY_001.getMessage(certPath));
        }
    }

    public static Object[] getPrivateKeyAndCertificate(String p12FilePath, String p12FilePassword, Logger logger) throws AuthenticatorCryptoException {
        logger.info("Reading P12 file. File Path: {}", p12FilePath);
        try (FileInputStream fis = new FileInputStream(p12FilePath)) {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(fis, p12FilePassword.toCharArray());

            String alias = keyStore.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, p12FilePassword.toCharArray());
            Certificate certificate = keyStore.getCertificate(alias);

            return new Object[]{privateKey, certificate};
        }
        catch (Exception e) {
            logger.error("Error Loading P12 file to create objects. Error: {}", e.getMessage(), e);
            throw new AuthenticatorCryptoException(
                    Errors.AUT_CRY_002.name(),
                    Errors.AUT_CRY_002.getMessage(p12FilePath)
            );
        }
    }

    private String calculateEncCertThumbprint(String certPath) throws AuthenticatorCryptoException {
        logger.info("Calculating thumbprint for certificate: {}", certPath);
        try (FileInputStream fis = new FileInputStream(certPath)) {
            CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
            X509Certificate cert = (X509Certificate) certFactory.generateCertificate(fis);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedCert = digest.digest(cert.getEncoded());

            return Base64.encodeBase64URLSafeString(encodedCert);
        }
        catch (Exception e) {
            logger.error("Error calculating thumbprint for certificate: {}", certPath, e);
            throw new AuthenticatorCryptoException(
                    Errors.AUT_CRY_001.name(),
                    Errors.AUT_CRY_001.getMessage(certPath)
            );
        }
    }

    public static JWK getJwkPrivateKey(PrivateKey privateKey, String keyPassword, Logger logger) throws Exception {
        logger.info("Creating JWK key for JWS signing.");

        // Convert the private key to PKCS#8 format
        byte[] privateKeyBytes = privateKey.getEncoded();
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey pkcs8PrivateKey = keyFactory.generatePrivate(keySpec);

        // Convert the private key to PEM format
        String privateKeyPem = "-----BEGIN PRIVATE KEY-----\n" +
                java.util.Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(pkcs8PrivateKey.getEncoded()) +
                "\n-----END PRIVATE KEY-----";

        // Create the JWK object
        return JWK.parseFromPEMEncodedObjects(privateKeyPem);
    }

    private byte[] asymmetricEncrypt(byte[] aesRandomKey) throws Exception {
        logger.debug("Encrypting the AES Random Key.");
        Cipher cipher = Cipher.getInstance(RSA_ALGO);
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(HASH_ALGO, MGF1, MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
        cipher.init(Cipher.ENCRYPT_MODE, encryptPublicKey, oaepParams);
        return cipher.doFinal(aesRandomKey);
    }

    private byte[] asymmetricDecrypt(byte[] encryptedData) throws Exception {
        logger.debug("Asymmetric Decryption");
        Cipher cipher = Cipher.getInstance(RSA_ALGO);
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                HASH_ALGO,
                MGF1,
                MGF1ParameterSpec.SHA256,
                PSource.PSpecified.DEFAULT
        );
        cipher.init(Cipher.DECRYPT_MODE, decryptPrivateKey, oaepParams);
        return cipher.doFinal(encryptedData);
    }


    private static byte[] symmetricEncrypt(byte[] data, byte[] key, byte[] aad) throws Exception {
        SecretKeySpec spec = new SecretKeySpec(key, "AES");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

        byte[] iv = new byte[16]; // GCM standard IV size
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(iv);

        GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, spec, gcmParameterSpec);

        byte[] encryptedData = cipher.doFinal(data);

        byte[] output = new byte[encryptedData.length + iv.length];
        System.arraycopy(encryptedData, 0, output, 0, encryptedData.length);
        System.arraycopy(iv, 0, output, encryptedData.length, iv.length);
        return output;
    }

    private static byte[] symmetricDecrypt(byte[] encryptedData, byte[] key, byte[] aad) throws Exception {
        SecretKeySpec spec = new SecretKeySpec(key, "AES");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

        byte[] iv = new byte[16];
        System.arraycopy(encryptedData, encryptedData.length - iv.length, iv, 0, iv.length);

        GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, spec, gcmParameterSpec);

        if (aad != null) {
            cipher.updateAAD(aad);
        }

        return cipher.doFinal(encryptedData, 0, encryptedData.length - iv.length);
    }


    public Map<String, Object> decryptAuthData(String sessionKeyB64, String encryptedIdentityB64) throws Exception {
        try {
            String sessionKeyB64Padded = Base64URL.encode(Base64URL.from(sessionKeyB64).decode()).toString();
            String encryptedIdentityB64Padded = Base64URL.encode(Base64URL.from(encryptedIdentityB64).decode()).toString();

            byte[] sessionKey = Base64.decodeBase64(sessionKeyB64Padded);
            byte[] encryptedIdentity = Base64.decodeBase64(encryptedIdentityB64Padded);

            byte[] symKey = asymmetricDecrypt(sessionKey);

            byte[] identity = symmetricDecrypt(encryptedIdentity, symKey, null);

            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(identity, Map.class);
        }
        catch (Exception e) {
            logger.error("Error decrypting Auth Data. Error Message: {}", e.getMessage(), e);
            throw new AuthenticatorCryptoException(Errors.AUT_CRY_003.name(), Errors.AUT_CRY_003.getMessage());
        }
    }

    public String[] encryptAuthData(byte[] authData) throws Exception {
        logger.info("Request for Auth Data Encryption.");
        if (authData == null || authData.length == 0) {
            throw new IllegalArgumentException("Auth data cannot be null or empty");
        }

        try {
            byte[] aesKey = new byte[symmetricKeySize / 8];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(aesKey);

            byte[] encryptedAuthData = symmetricEncrypt(authData, aesKey, null);
            String encryptedAuthB64Data = Base64.encodeBase64URLSafeString(encryptedAuthData);
            logger.info("Generating AES Key and encrypting Auth Data Completed.");

            byte[] encryptedAesKey = asymmetricEncrypt(aesKey);
            String encryptedAesKeyB64 = Base64.encodeBase64URLSafeString(encryptedAesKey);
            logger.info("Encrypting Random AES Key Completed.");

            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] authDataHash = sha256.digest(authData);
            String hexStr = Hex.encodeHexString(authDataHash).toUpperCase();

            byte[] encryptedHashData = symmetricEncrypt(hexStr.getBytes(), aesKey, null);
            String encAuthDataHashB64 = Base64.encodeBase64URLSafeString(encryptedHashData);

            logger.info("Generation of SHA256 Hash for the Auth Data completed.");
            return new String[]{encryptedAuthB64Data, encryptedAesKeyB64, encAuthDataHashB64};
        } catch (Exception e) {
            logger.error("Error encrypting Auth Data. Error Message: {}", e.getMessage(), e);
            throw new AuthenticatorCryptoException(Errors.AUT_CRY_003.name(), Errors.AUT_CRY_003.getMessage());
        }
    }

    public String signAuthRequestData(String authRequestData) throws Exception {
        logger.info("Request for Sign Auth Request Data.");
        try {
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .x509CertChain(Collections.singletonList(Base64URL.encode(signCert.getEncoded())))
                    .keyID(Base64.encodeBase64URLSafeString(signCert.getEncoded()))
                    .build();

            JWSObject jwsObject = new JWSObject(header, new Payload(authRequestData));
            JWSSigner signer = new RSASSASigner(signPrivateKey);
            jwsObject.sign(signer);

            String[] jwsParts = jwsObject.serialize().split("\\.");
            logger.info("Generation for JWS Signature completed.");
            return jwsParts[0] + ".." + jwsParts[2];
        } catch (Exception e) {
            logger.error("Error Signing data. Error: {}", e.getMessage(), e);
            throw new RuntimeException(
                    Errors.AUT_CRY_004.name(),
                    e
            );
        }
    }

    public String getEncCertThumbprint() {
        return this.encCertThumbprint;
    }
}