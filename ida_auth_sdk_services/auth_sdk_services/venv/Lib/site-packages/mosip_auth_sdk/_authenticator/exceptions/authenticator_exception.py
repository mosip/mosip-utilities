from enum import Enum


class AuthenticatorException(Exception):
    def __init__(self, error_code, error_message):
        self.error_code = error_code
        self.error_message = error_message
        super().__init__(self.error_message)


class AuthenticatorCryptoException(Exception):
    def __init__(self, error_code, error_message):
        self.error_code = error_code
        self.error_message = error_message
        super().__init__(self.error_message)


class Errors(Enum):
    AUT_CRY_001 = (
        "Error Parsing Encryption Certificate provided in config file. File Name: {}"
    )
    AUT_CRY_002 = "Error Reading P12 file provided in config file. File Name: {}"
    AUT_CRY_003 = "Error Encrypting Auth Data."
    AUT_CRY_004 = "Error Signing Auth Request Data."
    AUT_CRY_005 = "Controller Method Not Found For Method {}. Supported Methods are {}"

    AUT_BAS_001 = "Not Able to process auth request."

    AUT_OTP_001 = "No channels found. Please Pass otp=True or phone=True"
