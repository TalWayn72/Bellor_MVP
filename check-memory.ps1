Write-Host "=== Node.js Processes ===" -ForegroundColor Green
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Select-Object Id, @{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,2)}}, @{N='CPU';E={$_.CPU}}, Path | Sort-Object MemoryMB -Descending | Format-Table -AutoSize

    $total = ($nodeProcesses | Measure-Object WorkingSet64 -Sum).Sum
    Write-Host "Total Node.js Memory: $([math]::Round($total/1MB,2)) MB" -ForegroundColor Yellow
    Write-Host "Node.js Process Count: $($nodeProcesses.Count)" -ForegroundColor Yellow
} else {
    Write-Host "No Node.js processes running" -ForegroundColor Red
}

Write-Host "`n=== VS Code / Electron Processes ===" -ForegroundColor Green
$codeProcesses = Get-Process | Where-Object {$_.ProcessName -like '*code*' -or $_.ProcessName -like '*electron*'} -ErrorAction SilentlyContinue
if ($codeProcesses) {
    $codeProcesses | Select-Object Name, @{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,2)}}, Id | Sort-Object MemoryMB -Descending | Format-Table -AutoSize

    $total = ($codeProcesses | Measure-Object WorkingSet64 -Sum).Sum
    Write-Host "Total VS Code Memory: $([math]::Round($total/1MB,2)) MB" -ForegroundColor Yellow
    Write-Host "VS Code Process Count: $($codeProcesses.Count)" -ForegroundColor Yellow
} else {
    Write-Host "No VS Code processes running" -ForegroundColor Red
}

Write-Host "`n=== System Memory Overview ===" -ForegroundColor Green
$os = Get-CimInstance Win32_OperatingSystem
$totalMem = [math]::Round($os.TotalVisibleMemorySize/1KB,2)
$freeMem = [math]::Round($os.FreePhysicalMemory/1KB,2)
$usedMem = $totalMem - $freeMem
$usedPercent = [math]::Round(($usedMem/$totalMem)*100,2)

Write-Host "Total RAM: $totalMem MB"
Write-Host "Used RAM: $usedMem MB ($usedPercent%)"
Write-Host "Free RAM: $freeMem MB"
