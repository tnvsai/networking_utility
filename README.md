# 🌐 Networking Utility Tool

A powerful desktop tool for analyzing device status, pinging multiple IPs automatically, and parsing interface alerts.
Built with **Python Eel** for a modern, responsive UI.

![Icon](icon.png)

---

## 📥 1. Download & Run (Recommended)

The easiest way to use the tool is to download the latest standalone executable. **No Python installation required.**

1.  Go to the **[Releases Page](../../releases)** of this repository.
2.  Download the latest `NetworkingUtility-vX.X.X.exe`.
3.  Double-click to run! 🚀

> **Note:** On the first run, Windows might show a "SmartScreen" warning because the app is not signed. You can safely click "More Info" -> "Run Anyway".

---

## 🛠️ 2. Build Yourself (Local Development)

If you want to modify the code or build it yourself:

### Prerequisites
*   Python 3.10+ installed.

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tnvsai/networking_utility.git
    cd networking_utility
    ```

### ⚡ Quick Start (Windows)
Simply double-click **`run_app.bat`**.
This script automatically:
*   Checks for Python.
*   Installs/Updates dependencies.
*   Launches the application.

### Manual Run
If you prefer the command line:
1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Run:**
    ```bash
    python app.py
    ```

### 🏗️ Build Standalone .exe
To create your own executable file:

1.  **Install PyInstaller:**
    ```bash
    pip install pyinstaller
    ```
2.  **Build:**
    ```bash
    # This command uses the config in NetworkingUtility.spec
    pyinstaller NetworkingUtility.spec --clean
    ```
3.  **Find the App:**
    The new `.exe` will be in the `dist` folder.

---

## 🤖 3. Automated Release Process

This repository uses **GitHub Actions** to automate releases.

To publish a new version:
1.  **Tag your commit** with a version number (e.g., `v1.2.3`):
    ```bash
    git tag v1.2.3
    ```
2.  **Push the tag** to GitHub:
    ```bash
    git push origin v1.2.3
    ```

**GitHub will automatically:**
*   Build the executable.
*   Create a new Release page.
*   Upload the ready-to-use `.exe` file.

---

## ✨ Key Features
*   **Auto-Ping:** Automatically pings lists of IPs and reports status (UP/DOWN).
*   **Interface Analysis:** Parses "Interface Down" alerts to extract unique devices.
*   **Templates:** Quick-copy templates for incident resolution.
*   **Visual Progress:** Real-time progress bar during operations.
*   **Export:** Easy Copy/Paste buttons for reports.

---

*Built with ❤️ feel free to contribute.*
