import json
import time
import os
from mosip_auth_sdk.otp_generate import generate_otp
from mosip_auth_sdk.otp_verify import authenticate_user_with_otp
from mosip_auth_sdk.otp_generate import load_config
from mosip_auth_sdk.otp_generate import initialize_authenticator

OTP_DATA_FILE = "examples/test_cases/otp_data.json"
CONFIG_PATH = "./settings.toml"
OTP_DATA_FILE = "./user_data.json"


def main():

    config = load_config(CONFIG_PATH)
    authenticator = initialize_authenticator(config)
    # Step 1: Generate OTP
    try:
        response = generate_otp(
            user_data_path=OTP_DATA_FILE,
            config_path=CONFIG_PATH
        )
        print("OTP generated successfully.")
    except Exception as e:
        print("Failed to generate OTP:", str(e))
        return

   

if __name__ == "__main__":
    main()
