$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
az appservice plan list --resource-group quantdesk-rg-sweden --query "[].{name:name, state:provisioningState}" -o table
