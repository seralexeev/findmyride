#!/bin/bash

mc alias set minio http://minio:9000 findmyride findmyride

until mc ls minio; do
  >&2 echo "MinIO is unavailable - waiting"
  sleep 1
done

mc mb minio/findmyride
mc anonymous set public minio/findmyride