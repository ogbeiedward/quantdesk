New-Item -ItemType Directory -Force -Path "D:\Docker_folder\app"
New-Item -ItemType Directory -Force -Path "D:\Docker_folder\data"
Write-Host "Downloading Docker Installer via curl..."
curl.exe -L -o D:\Docker_folder\DockerDesktopInstaller.exe https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
Write-Host "Installing Docker Desktop to D:\Docker_folder... This will take a few minutes."
$args = @("install", "--quiet", "--accept-license", "--installation-dir=D:\Docker_folder\app", "--wsl-default-data-root=D:\Docker_folder\data")
Start-Process -FilePath "D:\Docker_folder\DockerDesktopInstaller.exe" -ArgumentList $args -Wait -NoNewWindow
Write-Host "Installation Finished."
