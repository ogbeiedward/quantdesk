# Final Secret Repair Script
# Run this script to fix the 401 Unauthorized errors in GitHub.

$acrName = "quantdeskacrswe9918" # <-- DOUBLE CHECK THIS NAME IN THE AZURE PORTAL
$subId = "f6b77bb9-e5ef-4983-9d97-b7ff5b33e6e4"

Write-Host "Syncing with Azure..." -ForegroundColor Cyan
az account set --subscription $subId

# 1. Enable Admin Account (Required for Docker Login)
Write-Host "Enabling Admin Account on $acrName..."
az acr update --name $acrName --admin-enabled true

# 2. Get the official Credentials
$creds = az acr credential show --name $acrName | ConvertFrom-Json
$username = $creds.username
$password = $creds.passwords[0].value

Write-Host "`n--- COPY THESE 2 SECRETS TO GITHUB ---" -ForegroundColor Green
Write-Host "ACR_USERNAME: $username"
Write-Host "ACR_PASSWORD: $password"
Write-Host "`nPaste these exactly into: GitHub -> Settings -> Secrets -> Actions"
Write-Host "Make sure there are NO leading or trailing spaces!" -ForegroundColor Red
