#!/bin/bash

mc alias set minio http://minio:9000 findmyride findmyride

until mc ls minio; do
  echo >&2 "MinIO is unavailable - waiting"
  sleep 1
done

mc mb minio/findmyride
mc anonymous set public minio/findmyride
mc admin user svcacct add minio/findmyride findmyride --access-key "ak_findmyride" --secret-key "findmyride"
