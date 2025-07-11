from mosip_auth_sdk.demo_kyc_service import perform_kyc_from_json_file

def main():
    try:
        response = perform_kyc_from_json_file(
            json_path="./user_data.json",
            config_path="./settings.toml"
        )
        print("KYC Decrypted Response:")
        print(response)

    except Exception as e:
        print("KYC process failed with error:")
        print(str(e))

if __name__ == "__main__":
    main()
