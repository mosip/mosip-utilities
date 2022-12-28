#!/bin/bash
export PIPENV_VENV_IN_PROJECT="enabled"

sudo apt install -y python3.10
sudo apt install -y python3-pip
sudo pip3 install pipenv

sudo pipenv install python-dotenv
sudo pipenv install requests
sudo pipenv install psycopg2-binary
sudo pipenv install argparse
sudo pipenv install openpyxl
sudo pipenv install urllib3