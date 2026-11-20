$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolDirectory = Join-Path $PSScriptRoot 'environment'
$cacheDirectory = Join-Path $projectRoot '.tools/npm-cache'

# No global installations, profile edits, execution-policy changes, or browser download.
& npm.cmd ci --prefix $toolDirectory --cache $cacheDirectory --ignore-scripts --registry=https://registry.npmjs.org
if ($LASTEXITCODE -ne 0) { throw 'Environment tool installation failed.' }

$configDirectory = Join-Path $projectRoot '.codex'
$configPath = Join-Path $configDirectory 'config.toml'
if (Test-Path -LiteralPath $configPath) {
    Write-Host 'Existing project Codex config preserved. Check Playwright and Chrome DevTools entries manually if needed.'
} else {
    New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null
    $rootForToml = $projectRoot.Replace('\', '/')
    $config = @"
# Local generated configuration. Re-run setup after moving the repository.
[mcp_servers.playwright]
command = "node"
args = ["$rootForToml/tools/run-playwright-mcp.mjs"]
cwd = "$rootForToml"
startup_timeout_sec = 30
tool_timeout_sec = 60

[mcp_servers.chrome-devtools]
command = "node"
args = ["$rootForToml/tools/run-devtools-mcp.mjs"]
cwd = "$rootForToml"
startup_timeout_sec = 30
tool_timeout_sec = 60
"@
    [System.IO.File]::WriteAllText($configPath, $config + "`n", [System.Text.UTF8Encoding]::new($false))
    Write-Host 'Created project-scoped Playwright and Chrome DevTools MCP config. Reload Codex to discover the server.'
}
