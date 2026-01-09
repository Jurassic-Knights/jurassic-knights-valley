---
description: Commit and push changes to GitHub
---

# GitHub Commit Workflow

When the user runs `/github`, perform the following:

// turbo
1. Run `git status` to see what files have changed

2. Create a descriptive commit message summarizing the changes

// turbo  
3. Run `git add -A` to stage all changes

4. Run `git commit -m "COMMIT_MESSAGE"` with the generated message

// turbo
5. Run `git push` to push to the remote repository

6. Confirm to the user that the commit was successful and mention what was included

---

## Rules for Git Commits

- **Do NOT auto-commit** unless the user explicitly runs `/github` or gives approval
- When a logical unit of work is complete, **ask the user** if they want to commit
- Example prompt: "Would you like me to commit these changes to GitHub?"
- Wait for explicit user approval before running any git commands
