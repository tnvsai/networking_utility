@echo off
setlocal EnableExtensions
title Networking Utility Launcher

set "APP_PORT=8000"
set "VENV_DIR=.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"

:: Always run from the folder that contains this script
cd /d "%~dp0"

echo ===================================================
echo    Networking Utility - Setup and Launcher
echo ===================================================
echo.

:: --- Resolve system Python (prefer "python", fall back to "py -3") ---
set "PY_BOOT="
where python >nul 2>&1 && set "PY_BOOT=python"
if not defined PY_BOOT (
    where py >nul 2>&1 && set "PY_BOOT=py -3"
)
if not defined PY_BOOT (
    echo [ERROR] Python 3 is not installed or not on PATH.
    echo.
    echo Install from https://www.python.org/downloads/
    echo During setup, enable "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

echo [INFO] System Python:
"%PY_BOOT%" --version
if errorlevel 1 (
    echo [ERROR] Could not run Python. Try reinstalling Python 3.10+.
    pause
    exit /b 1
)

:: --- Require Python 3.10+ via temp script (avoid cmd.exe parenthesis parsing) ---
set "VER_CHECK=%TEMP%\networking_utility_pyver.py"
(
echo import sys
echo if sys.version_info[0] ^< 3 or sys.version_info[1] ^< 10:
echo     raise SystemExit(1^)
)>"%VER_CHECK%"
"%PY_BOOT%" "%VER_CHECK%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10 or newer is required.
    del "%VER_CHECK%" >nul 2>&1
    pause
    exit /b 1
)
del "%VER_CHECK%" >nul 2>&1

:: --- Project files ---
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found in:
    echo   %CD%
    pause
    exit /b 1
)

if not exist "app.py" (
    echo [ERROR] app.py not found in:
    echo   %CD%
    pause
    exit /b 1
)

:: --- Virtual environment (.venv) ---
if not exist "%VENV_PY%" (
    echo [INFO] Creating virtual environment in %VENV_DIR%...
    "%PY_BOOT%" -m venv %VENV_DIR%
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        echo Try: "%PY_BOOT%" -m venv %VENV_DIR%
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created.
    set "VENV_FRESH=1"
) else (
    echo [INFO] Using virtual environment: %VENV_DIR%
)

set "PY=%VENV_PY%"

:: --- Dependencies: skip pip when Eel is already installed in .venv ---
set "NEED_PIP=0"
if defined VENV_FRESH (
    set "NEED_PIP=1"
) else (
    "%PY%" -c "import eel" >nul 2>&1
    if errorlevel 1 set "NEED_PIP=1"
)

if "%NEED_PIP%"=="1" (
    echo [INFO] Installing dependencies into %VENV_DIR%...
    "%PY%" -m pip install -q -r requirements.txt
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo Try manually:
        echo   "%PY%" -m pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed.
) else (
    echo [INFO] Dependencies OK - Eel found, skipping pip.
)

:: --- Port pre-check (default Eel port) ---
call :check_port %APP_PORT%
if errorlevel 1 (
    echo.
    echo [WARN] Port %APP_PORT% is already in use.
    echo        Another Networking Utility instance or another app may be running.
    echo.
    netstat -ano | findstr "LISTENING" | findstr ":%APP_PORT%"
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 (
        echo [INFO] Launch cancelled.
        pause
        exit /b 1
    )
    echo.
)

echo [SUCCESS] Environment is ready!
echo.

:run_app
echo [INFO] Starting Networking Utility on port %APP_PORT%...
echo [INFO] Close this window or press Ctrl+C to quit.
echo.

"%PY%" app.py
set "APP_EXIT=%ERRORLEVEL%"

if not "%APP_EXIT%"=="0" (
    echo.
    echo [ERROR] Application exited with code %APP_EXIT%.
    if "%APP_EXIT%"=="1" echo If the window closed immediately, check port %APP_PORT% or run from this console for details.
    pause
)

endlocal & exit /b %APP_EXIT%

:: ---------------------------------------------------------------------------
:: Returns ERRORLEVEL 1 if something is LISTENING on the given port
:: ---------------------------------------------------------------------------
:check_port
set "CHK_PORT=%~1"
netstat -ano | findstr "LISTENING" | findstr ":%CHK_PORT%" >nul 2>&1
if errorlevel 1 exit /b 0
exit /b 1
