param([ValidateSet('Start', 'Stop', 'Status')][string]$Action = 'Status')
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$dataPath = Join-Path $projectRoot 'tmp/mysql-test-data'
$adminConfig = Join-Path $projectRoot 'tmp/mysql-admin.cnf'
$mysqlBin = 'E:/MySQL/MySQLServer/bin'
if (!(Test-Path -LiteralPath $dataPath) -or !(Test-Path -LiteralPath $adminConfig)) {
  throw 'This helper only manages the existing isolated local instance. For a fresh machine use compose.yaml and README.'
}
if ($Action -eq 'Start') {
  & "$mysqlBin/mysqladmin.exe" "--defaults-file=$adminConfig" ping --silent 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Output 'Local project MySQL is already running on port 13316.'; exit 0 }
  $serverArgs = @('--no-defaults','--basedir=E:/MySQL/MySQLServer',"--datadir=$dataPath",'--port=13316','--bind-address=127.0.0.1','--mysqlx=0','--default-time-zone=+00:00',"--log-error=$projectRoot/tmp/mysql-test.log")
  Start-Process -FilePath "$mysqlBin/mysqld.exe" -ArgumentList $serverArgs -WindowStyle Hidden
  Write-Output 'Starting isolated project MySQL on port 13316. Check tmp/mysql-test.log.'
} elseif ($Action -eq 'Stop') {
  & "$mysqlBin/mysqladmin.exe" "--defaults-file=$adminConfig" shutdown
} else {
  & "$mysqlBin/mysqladmin.exe" "--defaults-file=$adminConfig" ping
}
