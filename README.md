# 🌐 Networking Utility Tool

A powerful desktop tool for analyzing device status, pinging multiple IPs automatically, and parsing interface alerts.

## 🚀 How to Run (Easiest Method)

Simply double-click the **`run_app.bat`** file in the project folder. 

This will automatically:
1.  Check if Python is installed.
2.  Install necessary dependencies.
3.  Launch the application.

---

## 🐍 Run via Command Line

If you prefer using the terminal:

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run Application:**
    ```bash
    python app.py
    ```

---

## 📦 Create Standalone .exe

To build a portable `.exe` file that doesn't need Python installed:

```bash
# 1. Install PyInstaller
pip install pyinstaller

# 2. Build .exe
pyinstaller --onefile --windowed --name "NetworkingUtility" app.py
```

The executable will be generated in the `dist` folder.
