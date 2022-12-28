import os
from datetime import datetime

# Maven local repo
from pathlib import Path

home = str(Path.home())

# Env file path
env_path = os.path.abspath(
    os.path.join(os.path.abspath(Path()), '.env')
)

log_file_name = datetime.strftime(datetime.now(), "%Y%m%d")

log_path = os.path.abspath(
    os.path.join(os.path.abspath(Path()), "logs", log_file_name + '.log')
)

output_folder_path = os.path.abspath(
    os.path.join(os.path.abspath(Path()), 'output')
)

# result paths
cr_request_path = os.path.join(output_folder_path, 'crRequests.json')
cr_status_path = os.path.join(output_folder_path, 'crStatus.csv')

input_folder_path = os.path.abspath(
    os.path.join(os.path.abspath(Path()), 'input')
)

source_path = os.path.join(input_folder_path, 'source_list.csv')

def get_custom_logpath(file_name):
    path = os.path.join(os.path.abspath(Path()), "output", file_name)
    Path(path).mkdir(parents=True, exist_ok=True)
    log_path = os.path.abspath(
        os.path.join(path, file_name + '.log'))
    return log_path