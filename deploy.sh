#!/bin/bash

set -e;

APP_NAME=`basename $PWD`

sudo docker rm $APP_NAME-old || echo "No previous version to remove"
sudo docker rename $APP_NAME $APP_NAME-old || echo "No current version to rename"
sudo docker build . -t $APP_NAME:latest -t $APP_NAME:`git rev-parse --short HEAD`
sudo docker create --name $APP_NAME -p 127.0.0.1:8001:8000/tcp --restart unless-stopped $APP_NAME:latest

sudo docker stop $APP_NAME-old || echo "No current version to stop"
sudo docker start $APP_NAME

sudo docker exec -it $APP_NAME python /noscroll/manage.py migrate --no-input

sudo docker cp $APP_NAME:/noscroll/dist/. dist
sudo docker cp $APP_NAME:/noscroll/ui/build/. dist
