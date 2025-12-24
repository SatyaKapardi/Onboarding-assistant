# Git Setup Instructions

Follow these steps to push the project to GitHub:

## 1. Initialize Git Repository

```bash
git init
git branch -M main
```

## 2. Add All Files

```bash
git add .
```

## 3. Create Initial Commit

```bash
git commit -m "Initial commit: Office Space Listing Assistant with Groq AI"
```

## 4. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (don't initialize with README)
3. Copy the repository URL

## 5. Add Remote and Push

```bash
git remote add origin <your-repository-url>
git push -u origin main
```

## Important Notes

- Make sure you have a `.env.local` file with your `GROQ_API_KEY` (this file is gitignored)
- Never commit your actual API keys
- The `.env.example` file shows what environment variables are needed

