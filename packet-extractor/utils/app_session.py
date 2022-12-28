import requests
from utils.app_logger import myprint
from utils.app_helper import get_timestamp, read_token, parse_response
from utils.app_json import dict_to_json
import config as conf
from utils.app_logger import info, error, debug

class MosipSession:
    def __init__(self, server, user, pwd, logger_name, appid='resident', ssl_verify=True):
        self.server = server
        self.user = user
        self.pwd = pwd
        self.ssl_verify = conf.ssl_verify
        self.logger_name = logger_name
        self.token = self.authGetToken(appid, self.user, self.pwd, self.logger_name)

    def authGetToken(self, appid, username, pwd, logger_name):
        info(logger_name, f"authenticate api ({appid}) called")
        url = '%s/v1/authmanager/authenticate/clientidsecretkey' % self.server
        info(logger_name, f"url - {url}")
        ts = get_timestamp()
        j = {
            "id": "mosip.io.clientId.pwd",
            "metadata": {},
            "version": "1.0",
            "requesttime": ts,
            "request": {
                "appId": appid,
                "clientId": username,
                "secretKey": pwd
            }
        }
        r = requests.post(url, json=j, verify=self.ssl_verify)
        resp = parse_response(r)
        debug(logger_name, "Response: "+ dict_to_json(resp))
        token = read_token(r)
        return token
    