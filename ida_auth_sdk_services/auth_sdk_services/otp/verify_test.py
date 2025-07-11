import json
import time
import os
from mosip_auth_sdk.otp_verify import authenticate_user_with_otp
from mosip_auth_sdk.otp_verify import load_otp_data
from mosip_auth_sdk.otp_verify import validate_otp_data
from mosip_auth_sdk.otp_verify import authenticate_user_with_otp
from mosip_auth_sdk.otp_verify import initialize_authenticator
from mosip_auth_sdk.otp_verify import load_config


USER_DATA="./user_data.json"
OTP_VALUES="./otp_data.json"
CONFIG_PATH="./settings.toml"

def main():

    config = load_config(CONFIG_PATH)
    authenticator = initialize_authenticator(config)

    response = authenticate_user_with_otp(
        authenticator,
        USER_DATA,
        OTP_VALUES,
        CONFIG_PATH
    )

    print(response)


if __name__ == "__main__":
    main()