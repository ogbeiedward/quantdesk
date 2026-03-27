$env:Path = "C:\Program Files\Git\cmd;" + $env:Path
git add .github/workflows/azure-deploy.yml
git commit -m "Add GitHub Actions workflow for Azure deployment"
git push origin master
