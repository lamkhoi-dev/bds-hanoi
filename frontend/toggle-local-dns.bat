@echo off
:: Kiem tra xem co quyen Admin chua, chua thi yeu cau cap quyen
NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Dang yeu cau quyen quan tri (Run as Administrator)...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo   TOOL CHUYEN DOI MOI TRUONG (LOCAL / REAL) Website BDS
echo ========================================================
echo.

powershell -Command "$hosts = 'C:\Windows\System32\drivers\etc\hosts'; $lines = Get-Content $hosts; $found = $false; $newLines = @(); foreach ($line in $lines) { if ($line -match '127\.0\.0\.1\s+nhadatxunghe\.vn') { $found = $true; if ($line.StartsWith('#')) { $newLines += '127.0.0.1 nhadatxunghe.vn'; Write-Host '[+] DA BAT che do TEST LOCAL (vao domain se chay localhost)' -ForegroundColor Green; } else { $newLines += '# 127.0.0.1 nhadatxunghe.vn'; Write-Host '[-] DA TAT che do TEST LOCAL (vao domain se chay hang REAL)' -ForegroundColor Yellow; } } else { $newLines += $line; } }; if (-not $found) { $newLines += '127.0.0.1 nhadatxunghe.vn'; Write-Host '[+] DA THEM VA BAT che do TEST LOCAL' -ForegroundColor Green; }; [IO.File]::WriteAllLines($hosts, $newLines);"

echo.
echo Phim DNS cache de trinh duyet nhan thay doi ngay lap tuc...
ipconfig /flushdns >nul

echo.
echo Hoan tat! Nhan phim bat ky de thoat...
pause >nul
