$gitPath = "C:\Program Files\Git\cmd\git.exe"
& $gitPath init
& $gitPath config user.email "s141521eo@student.pcz.pl"
& $gitPath config user.name "Edward Ogbei"
& $gitPath add .
& $gitPath commit -m "Initial commit of QuantDesk project"
