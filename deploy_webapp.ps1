$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
az webapp create --resource-group quantdesk-rg-sweden --plan quantdesk-plan --name quantdesk-app9918 --multicontainer-config-type compose --multicontainer-config-file docker-compose.prod.yml

# We also need to configure the Web App to pull from the private Azure Container Registry.
$acrPassword = az acr credential show --name quantdeskacrswe9918 --query "passwords[0].value" -o tsv
az webapp config container set --name quantdesk-app9918 --resource-group quantdesk-rg-sweden --docker-registry-server-url https://quantdeskacrswe9918.azurecr.io --docker-registry-server-user quantdeskacrswe9918 --docker-registry-server-password $acrPassword

# Restart app
az webapp restart --name quantdesk-app9918 --resource-group quantdesk-rg-sweden
