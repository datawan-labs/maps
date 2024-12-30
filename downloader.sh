#!/bin/bash

# install faster downloader & unzip
sudo apt install axel unzip

# install AWS
axel "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"
unzip awscli-exe-linux-x86_64.zip
sudo ./aws/install

# install pmtiles
axel https://github.com/protomaps/go-pmtiles/releases/download/v1.22.3/go-pmtiles_1.22.3_Linux_x86_64.tar.gz
tar -xf go-pmtiles_1.22.3_Linux_x86_64.tar.gz

# download the data (120+gb)
axel https://build.protomaps.com/20241230.pmtiles

# check the header
./pmtiles show 20241230.pmtiles

# transfer to S3
AWS_ACCESS_KEY_ID= AWS_SECRET_ACCESS_KEY= aws --endpoint-url <bucket-url> s3 cp ./20241230.pmtiles s3://<bucket>/tiles/planet.pmtiles