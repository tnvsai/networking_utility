@echo off
setlocal
title Network Utility Launcher

echo ===================================================
echo    Network Utility - Auto Setup & Launcher
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

:: 2. Check Dependencies (Fast Start)
echo [INFO] Checking dependencies...
python -c "import eel; import ping3" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] All dependencies present. Starting app instantly...
    goto :run_app
)

:: 3. Install Dependencies (Only if missing)
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found!
    pause
    exit /b 1
)

echo [INFO] Installing/Updating required packages...
pip install -r requirements.txt
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
