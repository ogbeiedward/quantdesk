Write-Host "Installing Docker Desktop to D:\Docker_folder... This will take a few minutes."
$args = @("install", "--quiet", "--accept-license", "--installation-dir=`"D:\Docker_folder\app`"", "--wsl-default-data-root=`"D:\Docker_folder\data`"")
Start-Process -FilePath "D:\Docker_folder\DockerDesktopInstaller.exe" -ArgumentList $args -Wait -NoNewWindow
Write-Host "Installation Finished."
