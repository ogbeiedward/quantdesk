$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
az webapp log download --name quantdesk-app9918 --resource-group quantdesk-rg-sweden --log-file quantdesk-logs.zip
Expand-Archive -Path quantdesk-logs.zip -DestinationPath quantdesk-logs -Force
