Write-Host "Registering Administrator Account (Edward Ogbei)..." -ForegroundColor Cyan

$body = @{
    email = "ogbeiedward@gmail.com"
    username = "Edward Ogbei"
    password = "Poland@2025"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Method Post -Uri "https://quantdesk-api-5vu4.onrender.com/api/auth/signup" -ContentType "application/json" -Body $body
    Write-Host "Success! Account created." -ForegroundColor Green
    Write-Host "You can now log in at your Vercel URL." -ForegroundColor Green
} catch {
    Write-Host "Error creating account. Make sure Render has finished building!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
