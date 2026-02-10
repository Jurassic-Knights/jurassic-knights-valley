# One-time setup: enable push from this environment

So the agent (and you) can push to `https://github.com/Jurassic-Knights/jurassic-knights-valley` without typing credentials:

1. **Create a GitHub Personal Access Token**
   - GitHub → Settings → Developer settings → Personal access tokens.
   - Create a token (classic or fine-grained) with `repo` scope.
   - Copy the token (starts with `ghp_`).

2. **Add it to this repo (gitignored)**
   - In the repo root, create or edit **.env.local**.
   - Add one line:  
     `GITHUB_TOKEN=ghp_your_token_here`  
   - Save. `.env.local` is in `.gitignore` and will not be committed.

3. **Credential helper (already set)**
   - This repo is already configured to use `scripts/git-credential-github-token.ps1`, which reads `GITHUB_TOKEN` from the environment or from `.env.local`.
   - Remote is set to HTTPS: `https://github.com/Jurassic-Knights/jurassic-knights-valley.git`.

4. **Optional: SSH host key**
   - If you use SSH and see "Host key verification failed", GitHub’s host keys have been added to `%USERPROFILE%\.ssh\known_hosts`. If you use HTTPS only, you can skip this.

After step 2, run `git push origin main` (or let the agent run it); it will use the token and push without prompting.
