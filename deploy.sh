#!/bin/bash

echo "command - npx tsc"
npx tsc

echo "command - aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 975050061542.dkr.ecr.ap-south-1.amazonaws.com"
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 975050061542.dkr.ecr.ap-south-1.amazonaws.com

echo "command - docker build --platform linux/amd64 --progress=plain -t scraper ."
docker build --platform linux/amd64 --progress=plain -t scraper .

echo "command - docker tag scraper:latest 975050061542.dkr.ecr.ap-south-1.amazonaws.com/scraper:latest"
docker tag scraper:latest 975050061542.dkr.ecr.ap-south-1.amazonaws.com/scraper:latest

echo "command - docker push 975050061542.dkr.ecr.ap-south-1.amazonaws.com/scraper:latest"
docker push 975050061542.dkr.ecr.ap-south-1.amazonaws.com/scraper:latest