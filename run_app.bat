@echo off
setlocal
title Network Utility Launcher

echo ===================================================
echo    Network Utility - Auto Setup and Launcher
echo ===================================================
echo.

:: 1. Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not found in PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo and make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:: 2. Check Dependencies (Skipped "Fast Check" to ensure updates are applied)
:: We removed the auto-skip so it always enforces requirements.txt
:: This ensures setuptools<81 is applied to fix the warning.

:: 3. Install Dependencies (Only if missing)
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found!
    pause
    exit /b 1
)

echo [INFO] Verifying dependencies...
python -m pip install -q -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo Please check your internet connection or pip configuration.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Environment is ready!

:run_app
echo [INFO] Starting Network Utility...
echo.

:: 4. Run the Application
python app.py

:: 5. Handle Exit
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application exited with error code %errorlevel%.
    pause
)

endlocal
