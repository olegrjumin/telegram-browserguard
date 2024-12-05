#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Get the repository name and username
REPO_URL=$(git config --get remote.origin.url)
REPO_NAME=$(basename -s .git "$REPO_URL")
USERNAME=$(echo "$REPO_URL" | grep -o ':.*/' | tr -d ':/' | cut -d'/' -f1)

# Store current directory
ORIGINAL_DIR=$(pwd)

# Build the mini app
echo -e "${GREEN}Building mini app...${NC}"
cd packages/telegram-mini-app
if ! npm run build; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

# Create or update gh-pages branch
echo -e "${GREEN}Deploying to GitHub Pages...${NC}"
git checkout --orphan gh-pages-temp
git rm -rf .

# Copy build files directly (not in dist directory)
cp -r packages/telegram-mini-app/dist/* .
cp -r packages/telegram-mini-app/dist/.* . 2>/dev/null || :

# Create .nojekyll file if it doesn't exist
touch .nojekyll

# Debug: Show what we're deploying
echo -e "${YELLOW}Files to be deployed:${NC}"
ls -la
echo -e "\n${YELLOW}Content of index.html:${NC}"
cat index.html

# Add all changes
git add -A
git commit -m "Deploy mini app to GitHub Pages"

# Replace gh-pages branch
git branch -D gh-pages 2>/dev/null || :
git branch -m gh-pages
if git push -f origin gh-pages; then
    echo -e "${GREEN}Successfully deployed to GitHub Pages${NC}"
    echo -e "${GREEN}Your site will be available at: https://$USERNAME.github.io/$REPO_NAME${NC}"
else
    echo -e "${RED}Failed to deploy${NC}"
    exit 1
fi

# Return to original branch and directory
git checkout -
cd "$ORIGINAL_DIR"

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for changes to appear on GitHub Pages${NC}"