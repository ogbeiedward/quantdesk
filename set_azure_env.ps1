# Set Azure App Service Environment Variables for QuantDesk
$rg = "quantdesk-rg-sweden"
$app = "quantdesk-app9918"

Write-Host "Setting environment variables for $app in $rg..."

# Base Configs
az webapp config appsettings set --name $app --resource-group $rg --settings `
  DATABASE_URL="postgresql+asyncpg://quantdesk:quantdesk@postgres:5432/quantdesk" `
  REDIS_URL="redis://redis:6379/0" `
  SECRET_KEY="change-me-in-production-123!" `
  CORS_ORIGINS="*" `
  VITE_API_URL="/api" `
  WEBSITES_PORT="80" `
  ALPHA_VANTAGE_API_KEY="YOUR_KEY_HERE"



Write-Host "Environment variables set successfully."
Write-Host "Please update ALPHA_VANTAGE_API_KEY with your real key if you have one."
