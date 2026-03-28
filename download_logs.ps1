# Azure Log Downloader for QuantDesk
$rg = "quantdesk-rg-sweden"
$app = "quantdesk-app9918"

Write-Host "Fetching logs for $app..." -ForegroundColor Cyan

# This will get the last 100 lines of the container logs
az webapp log tail --name $app --resource-group $rg
