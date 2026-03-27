$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") + ";C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;"
$acrPassword = az acr credential show --name quantdeskacrswe9918 --query "passwords[0].value" -o tsv
if ($acrPassword) {
    echo $acrPassword | gh secret set ACR_PASSWORD
    gh secret set ACR_USERNAME -b "quantdeskacrswe9918"
    Write-Host "Secrets set successfully."
} else {
    Write-Host "Failed to retrieve ACR password."
}
