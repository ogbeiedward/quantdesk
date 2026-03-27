$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$acrPassword = az acr credential show --name quantdeskacrswe9918 --query "passwords[0].value" -o tsv
az webapp config container set --name quantdesk-app9918 --resource-group quantdesk-rg-sweden --docker-registry-server-password $acrPassword
az webapp restart --name quantdesk-app9918 --resource-group quantdesk-rg-sweden
