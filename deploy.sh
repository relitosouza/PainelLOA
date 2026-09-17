#!/bin/bash
set -e

cd /home/PainelLOA

git checkout main
git pull --ff-only origin main

docker compose down
docker compose build --no-cache
docker compose up -d

docker image prune -f
docker compose ps