#!/bin/bash

docker build \
-f prod.Dockerfile \
--build-arg VITE_API_LINK=/api \
-t b-swing-dj .