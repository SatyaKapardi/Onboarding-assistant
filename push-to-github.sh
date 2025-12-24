#!/bin/bash

# Script to initialize git and push to GitHub
# Make sure you've created a GitHub repository first!

echo "Setting up git repository..."

# Initialize git
git init
git branch -M main

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Office Space Listing Assistant with Groq AI"

echo ""
echo "Git repository initialized!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub (https://github.com/new)"
echo "2. Copy the repository URL"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin <your-repository-url>"
echo "   git push -u origin main"
echo ""
echo "Remember: Create a .env.local file with your GROQ_API_KEY before running the app!"

