#!/bin/bash

# Load environment variables from ../.env file
if [ ! -f ../.env ]; then
  echo "Error: ../.env file not found. Please create one with the required configuration."
  exit 1
fi
source ../.env

if [ -z "$EC2_USER" ] || [ -z "$EC2_IP" ] || [ -z "$REPO_DIR" ] || [ -z "$BRANCH" ] || [ -z "$SSH_KEY_PATH" ]; then
  echo "Error: Missing required environment variables in ../.env."
  exit 1
fi

# Function to print messages
print_msg() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Step 1: Connect to EC2 and deploy
print_msg "Connecting to EC2 instance and starting deployment..."
ssh -i "$SSH_KEY_PATH" "$EC2_USER@$EC2_IP" <<EOF
  set -e

  # Navigate to the project directory
  cd "$REPO_DIR"

  # Pull latest changes from Git
  echo "Pulling latest changes from $BRANCH branch..."
  git fetch origin
  git reset --hard origin/$BRANCH

  # Stop running containers
  echo "Stopping running containers..."
  docker-compose down

  # Rebuild and start containers
  echo "Rebuilding and starting containers..."
  docker-compose up --build -d

  # Verify containers are running
  echo "Checking container status..."
  docker ps
EOF

print_msg "Deployment completed."
