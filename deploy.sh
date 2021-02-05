#!/bin/bash

set -e;

sudo docker-compose pull
sudo docker-compose up --build -d

sudo docker exec -it noscroll python /noscroll/manage.py migrate --no-input

sudo docker cp noscroll:/noscroll/dist/. dist
sudo docker cp noscroll:/noscroll/ui/build/. dist
