#!/bin/bash

set -e;

APP_NAME=`basename $PWD`

python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

sudo docker rm $APP_NAME-old || echo "No previous version to remove"
sudo docker rename $APP_NAME $APP_NAME-old || echo "No current version to rename"
sudo docker build . -t $APP_NAME:latest -t $APP_NAME:`git rev-parse --short HEAD`
sudo docker create --name $APP_NAME -p 127.0.0.1:8001:8000/tcp --restart unless-stopped $APP_NAME:latest

python manage.py migrate
python manage.py collectstatic
sudo docker stop $APP_NAME-old || echo "No current version to stop"
sudo docker start $APP_NAME