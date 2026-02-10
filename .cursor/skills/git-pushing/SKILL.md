---
name: git-pushing
description: Stage, commit, and push to origin with conventional commit messages. Use when the user wants to commit and push, save to GitHub, or says "push changes", "commit and push", "push to github", or similar.
---

# Git push workflow (Cursor)

Stage all changes, create a conventional commit, and push to the remote branch. This skill makes the **environment** able to push (no manual steps) and defines the **workflow** the agent follows.

## When to use

- User says "push", "commit and push", "push to github", "save to remote", "push changes", etc.
- After completing a feature and the user wants it on the remote.

## One-time setup (environment can push)

For the agent’s terminal to push without interactive login:

1. **GitHub host keys (SSH)**  
   So `git push` over SSH doesn’t fail with "Host key verification failed".  
   Add GitHub’s official host keys to `%USERPROFILE%\.ssh\known_hosts` (see [GitHub’s SSH key fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)); or run once:
   `ssh-keyscan github.com >> %USERPROFILE%\.ssh\known_hosts` (if ssh-keyscan works on the machine).

2. **HTTPS auth (recommended for this repo)**  
   So the agent can push over HTTPS without a password prompt:
   - Create a [GitHub Personal Access Token](https://github.com/settings/tokens) (repo scope).
   - Put it in the repo’s **.env.local** (gitignored):  
     `GITHUB_TOKEN=ghp_...`
   - In the repo root, set the **local** credential helper (one time):
     ```bash
     git config credential.helper "!powershell -ExecutionPolicy Bypass -File scripts/git-credential-github-token.ps1"
     ```
   - Keep **origin** as HTTPS:  
     `https://github.com/Jurassic-Knights/jurassic-knights-valley.git`

After this, the agent can run `git push origin main` (or the workflow below) and it will use the token from `.env.local`.

## Workflow (what the agent does)

1. **Remote**  
   Ensure `origin` is HTTPS (so the credential helper is used):
   ```bash
   git remote get-url origin
   ```
   If it shows `git@github.com:...`, set to HTTPS:
   ```bash
   git remote set-url origin https://github.com/Jurassic-Knights/jurassic-knights-valley.git
   ```

2. **Stage and commit**  
   - Stage everything: `git add -A`
   - Commit with a **conventional message** (e.g. `feat: add X`, `fix: Y`, `chore: Z`).  
   - If the pre-commit hook (lint) blocks the commit and the user asked to push, use `git commit --no-verify -m "message"` and note that lint should be fixed separately.

3. **Push**  
   - Get current branch: `git branch --show-current` (or assume `main`).
   - Push and set upstream if needed: `git push -u origin <branch>`

Use **git commands** in the agent’s shell (PowerShell on Windows); do not rely on the `.agent` bash script.

## Conventional commit examples

- `feat: add weapon wheel`
- `fix: collision on slopes`
- `chore: update deps`
- `docs: update README`

## Reference

- Original workflow: `.agent/skills/git-pushing/` (bash script; Cursor uses the steps above instead).
- Credential helper: `scripts/git-credential-github-token.ps1` (reads `GITHUB_TOKEN` from env or `.env.local`).
