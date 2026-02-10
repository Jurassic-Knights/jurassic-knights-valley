# Git credential helper: outputs GitHub HTTPS credentials from GITHUB_TOKEN.
# Used so the agent can push without interactive login. Token can be in env or .env.local.
# Set in repo: git config credential.helper "!powershell -ExecutionPolicy Bypass -File scripts/git-credential-github-token.ps1"

$request = @{}
foreach ($line in [System.IO.StreamReader]::new([System.Console]::OpenStandardInput()).ReadToEnd() -split "`n") {
    if ($line -match '^([^=]+)=(.*)$') { $request[$matches[1]] = $matches[2] }
}

$credHost = $request['host']
if ($credHost -notmatch 'github\.com') { return }

$token = $env:GITHUB_TOKEN
if (-not $token) {
    $root = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { Get-Location }
    $envFile = Join-Path $root '.env.local'
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*GITHUB_TOKEN\s*=\s*(.+)$') { $token = $matches[1].Trim() }
        }
    }
}
if ($token) {
    Write-Output "username=git"
    Write-Output "password=$token"
}
