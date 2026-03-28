# Azure Infrastructure Initialization Script for QuantDesk
# This script creates all necessary resources for an Institutional-grade deployment.

$subId = "f6b77bb9-e5ef-4983-9d97-b7ff5b33e6e4"
$rg = "quantdesk-rg-sweden"
$location = "swedencentral"
$plan = "quantdesk-plan"
$acr = "quantdeskacrswe9918"  # Must be globally unique
$app = "quantdesk-app9918"

Write-Host "--- Starting Azure Setup for Subscription $subId ---" -GitHubAlert NOTE

# 1. Set Subscription
az account set --subscription $subId

# 2. Create Resource Group
Write-Host "Creating Resource Group: $rg..."
az group create --name $rg --location $location

# 3. Create Container Registry (Basic tier is cheap/free for students)
Write-Host "Creating Azure Container Registry: $acr..."
az acr create --resource-group $rg --name $acr --sku Basic --admin-enabled true

# 4. Create App Service Plan (F1 is FREE)
Write-Host "Creating App Service Plan (Free Tier): $plan..."
az appservice plan create --name $plan --resource-group $rg --location $location --sku F1 --is-linux

# 5. Create Web App for Containers (Multi-container)
Write-Host "Creating Web App: $app..."
az webapp create --resource-group $rg --plan $plan --name $app --multicontainer-config-type compose --multicontainer-config-file docker-compose.prod.yml

# 6. Set Registry Credentials on the Web App
$acrPassword = az acr credential show --name $acr --query "passwords[0].value" -o tsv
az webapp config container set --name $app --resource-group $rg --docker-registry-server-url $acr`.azurecr.io --docker-registry-server-user $acr --docker-registry-server-password $acrPassword

Write-Host "--- Infrastructure Ready! ---" -ForegroundColor Green
Write-Host "NEXT STEPS:"
Write-Host "1. Your ACR is created. You can now push your images."
Write-Host "2. Go to the Azure Portal, find '$app', and download the 'Publish Profile' for GitHub."
