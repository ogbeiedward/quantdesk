$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Set the Websites Port to tell Azure where to route external traffic
az webapp config appsettings set --name quantdesk-app9918 --resource-group quantdesk-rg-sweden --settings WEBSITES_PORT=5173

# Push the new docker-compose file that binds 5173
az webapp config container set --name quantdesk-app9918 --resource-group quantdesk-rg-sweden --multicontainer-config-type compose --multicontainer-config-file docker-compose.prod.yml

# Restart the app
az webapp restart --name quantdesk-app9918 --resource-group quantdesk-rg-sweden
