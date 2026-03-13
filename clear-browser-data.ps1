# CyberXperience 2026 - Browser Data Cleanup Script
# Run this between sessions to clear cookies, cache, and history for the next user.
# Must be run as Administrator for full effect. Close all browsers before running.

param(
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"

# Check if browsers are running
$browsers = @("chrome", "msedge", "firefox", "brave")
$running = Get-Process -Name $browsers 2>$null

if ($running -and -not $Force) {
    Write-Host "`n[!] The following browsers are still running:" -ForegroundColor Yellow
    $running | ForEach-Object { Write-Host "    - $($_.ProcessName) (PID: $($_.Id))" }
    Write-Host ""
    $choice = Read-Host "Close them now and continue? (Y/N)"
    if ($choice -ne "Y" -and $choice -ne "y") {
        Write-Host "Aborted. Please close all browsers and try again." -ForegroundColor Red
        exit 1
    }
    $running | Stop-Process -Force
    Start-Sleep -Seconds 2
}

$cleared = @()
$failed = @()

function Remove-BrowserData {
    param([string]$Name, [string[]]$Paths)

    $found = $false
    foreach ($p in $Paths) {
        $expanded = [Environment]::ExpandEnvironmentVariables($p)
        if (Test-Path $expanded) {
            $found = $true
            try {
                Remove-Item -Path $expanded -Recurse -Force -ErrorAction Stop
                $script:cleared += "$Name ($expanded)"
            } catch {
                $script:failed += "$Name ($expanded): $($_.Exception.Message)"
            }
        }
    }
    if (-not $found) {
        # Browser not installed or paths don't exist - skip silently
    }
}

Write-Host "`n=== CyberXperience 2026 - Browser Cleanup ===" -ForegroundColor Cyan
Write-Host "Clearing cookies, cache, and history...`n"

# --- Google Chrome ---
$chromeBase = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default"
Remove-BrowserData "Chrome Cookies" @(
    "$chromeBase\Cookies",
    "$chromeBase\Cookies-journal"
)
Remove-BrowserData "Chrome Cache" @(
    "$chromeBase\Cache\Cache_Data",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker\CacheStorage"
)
Remove-BrowserData "Chrome History" @(
    "$chromeBase\History",
    "$chromeBase\History-journal",
    "$chromeBase\Visited Links",
    "$chromeBase\Top Sites",
    "$chromeBase\Top Sites-journal"
)
Remove-BrowserData "Chrome Session" @(
    "$chromeBase\Sessions",
    "$chromeBase\Session Storage",
    "$chromeBase\Local Storage"
)

# --- Microsoft Edge ---
$edgeBase = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default"
Remove-BrowserData "Edge Cookies" @(
    "$edgeBase\Cookies",
    "$edgeBase\Cookies-journal"
)
Remove-BrowserData "Edge Cache" @(
    "$edgeBase\Cache\Cache_Data",
    "$edgeBase\Code Cache",
    "$edgeBase\Service Worker\CacheStorage"
)
Remove-BrowserData "Edge History" @(
    "$edgeBase\History",
    "$edgeBase\History-journal",
    "$edgeBase\Visited Links",
    "$edgeBase\Top Sites",
    "$edgeBase\Top Sites-journal"
)
Remove-BrowserData "Edge Session" @(
    "$edgeBase\Sessions",
    "$edgeBase\Session Storage",
    "$edgeBase\Local Storage"
)

# --- Mozilla Firefox ---
$firefoxProfiles = "$env:APPDATA\Mozilla\Firefox\Profiles"
if (Test-Path $firefoxProfiles) {
    Get-ChildItem $firefoxProfiles -Directory | ForEach-Object {
        $prof = $_.FullName
        Remove-BrowserData "Firefox Cookies [$($_.Name)]" @(
            "$prof\cookies.sqlite",
            "$prof\cookies.sqlite-wal",
            "$prof\cookies.sqlite-shm"
        )
        Remove-BrowserData "Firefox Cache [$($_.Name)]" @(
            "$prof\cache2"
        )
        Remove-BrowserData "Firefox History [$($_.Name)]" @(
            "$prof\places.sqlite",
            "$prof\places.sqlite-wal",
            "$prof\places.sqlite-shm"
        )
        Remove-BrowserData "Firefox Session [$($_.Name)]" @(
            "$prof\sessionstore.jsonlz4",
            "$prof\sessionstore-backups"
        )
    }
}

# --- Brave ---
$braveBase = "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\User Data\Default"
Remove-BrowserData "Brave Cookies" @(
    "$braveBase\Cookies",
    "$braveBase\Cookies-journal"
)
Remove-BrowserData "Brave Cache" @(
    "$braveBase\Cache\Cache_Data",
    "$braveBase\Code Cache",
    "$braveBase\Service Worker\CacheStorage"
)
Remove-BrowserData "Brave History" @(
    "$braveBase\History",
    "$braveBase\History-journal",
    "$braveBase\Visited Links"
)
Remove-BrowserData "Brave Session" @(
    "$braveBase\Sessions",
    "$braveBase\Session Storage",
    "$braveBase\Local Storage"
)

# --- Summary ---
Write-Host ""
if ($cleared.Count -gt 0) {
    Write-Host "[OK] Cleared $($cleared.Count) items:" -ForegroundColor Green
    $cleared | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGreen }
}

if ($failed.Count -gt 0) {
    Write-Host "`n[!!] Failed to clear $($failed.Count) items:" -ForegroundColor Yellow
    $failed | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkYellow }
}

if ($cleared.Count -eq 0 -and $failed.Count -eq 0) {
    Write-Host "[OK] Nothing to clear - browsers appear clean already." -ForegroundColor Green
}

Write-Host "`n=== Cleanup complete. Machine is ready for the next user. ===`n" -ForegroundColor Cyan
