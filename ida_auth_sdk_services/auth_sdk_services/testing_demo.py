from mosip_auth_sdk.demo_auth import authenticate_from_json_file
from mosip_auth_sdk.demo_auth import initialize_authenticator
from mosip_auth_sdk.demo_auth import load_config



USER_DATA="./user_data.json"
OTP_VALUES="./otp_data.json"
CONFIG_PATH="./settings.toml"

def main():

    config = load_config(CONFIG_PATH)
    authenticator = initialize_authenticator(config)

    result = authenticate_from_json_file(
        json_path="user_data.json",
        config_path="settings.toml"
     )
    print(result)


if __name__ == "__main__":
    main()