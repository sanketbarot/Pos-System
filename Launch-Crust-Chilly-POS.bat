@echo off
title Crust & Chilly POS - 100%% Direct Silent Printing
echo ========================================================
echo   Crust & Chilly POS - Direct Auto-Printing
echo   URL: https://crustandchillybusiness.aitoolcor.com/#pos
echo   Printer: EPSON TM-T82 Receipt (Thermal)
echo ========================================================
echo.
echo Starting Live POS in Direct Auto-Print Mode...
echo (No print preview window, bills will print directly from EPSON TM-T82!)
echo.
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%LOCALAPPDATA%\Google\Chrome\POS_Profile" --kiosk-printing --app=https://crustandchillybusiness.aitoolcor.com/#pos
exit
