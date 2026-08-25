#!/bin/bash

set -e

export NVM_DIR="$HOME/.nvm"

if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
fi

echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

echo "================================="
echo "Starting InterviewHub deployment"
echo "================================="

cd /home/ubuntu/Interviewhub-AI

echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main

echo "---------------------------------"
echo "Installing backend dependencies"
echo "---------------------------------"

cd server
npm ci

echo "---------------------------------"
echo "Building frontend"
echo "---------------------------------"

cd ../client
npm ci
npm run build

echo "---------------------------------"
echo "Deploying frontend to Nginx"
echo "---------------------------------"

sudo rm -rf /var/www/interviewhub/*
sudo cp -r dist/* /var/www/interviewhub/

echo "---------------------------------"
echo "Restarting backend"
echo "---------------------------------"

cd ../server
pm2 restart interviewhub-api

echo "---------------------------------"
echo "Reloading Nginx"
echo "---------------------------------"

sudo systemctl reload nginx

echo "================================="
echo "Deployment completed successfully"
echo "================================="
