# 🌐 Networking Utility Tool

A powerful tool for network administrators to analyze device status, ping multiple IPs, and generate troubleshooting commands. Available as both a **web app** and **desktop app with auto-ping**.

## 🚀 Live Demo

**👉 [Use Online (Web Version)](https://tnvsai.github.io/networking_utility)** *(Update with your GitHub username)*

---

## ✨ Features

### Core Features (All Versions)
- ✅ **Bulk IP Extraction** - Extract all IP addresses from incident text
- ✅ **Ping Command Generator** - Auto-generate ping commands for multiple IPs  
- ✅ **Status Analyzer** - Parse ping results to identify UP/DOWN devices
- ✅ **Interface Down Parser** - Analyze interface outage alerts
- ✅ **Quick Copy Templates** - Pre-configured resolution templates
- ✅ **Device Commands** - Copy troubleshooting commands for network devices

### 🎯 Desktop App Exclusive
- 🚀 **AUTO-PING** - Automatically ping all IPs without manual copy-paste!
- 📊 **Real-time Progress** - Visual progress bar during ping execution
- ⚡ **Instant Results** - Results appear and auto-copy to clipboard
- 🖥️ **Cross-Platform** - Works on Windows, Mac, and Linux

---

## 📖 How to Use

### Option 1: Web Version (Quick & Easy)

**👉 Visit: [https://tnvsai.github.io/networking_utility](https://tnvsai.github.io/networking_utility)**

1. Paste your incident text containing IP addresses
2. Click **"Ping IP"** to generate ping commands
3. Copy and run commands in your terminal
4. Paste results back and click **"Node output"** for analysis

**Perfect for:** Quick access, no installation, cross-device use

---

### Option 2: Desktop App (Full Features + Auto-Ping)

#### 🔧 Setup (One-time):

**Pre-requisites:**
- Python 3.8+ ([Download here](https://www.python.org/downloads/))

**Install:**
```bash
# Clone or download this repository
git clone https://github.com/tnvsai/networking_utility.git
cd networking_utility

# Install dependencies
pip install -r requirements.txt
```

#### 🚀 Run:
```bash
python app.py
```

A window opens with your networking utility - **all features work including auto-ping!**

#### 🧪 Test Auto-Ping:
1. Paste text with IP addresses (example: `router-192.168.1.1 switch-10.0.0.1`)
2. Click **"🚀 Auto Ping"** button
3. Watch progress bar fill up
4. Results appear automatically!

**Perfect for:** Frequent use, automated workflows, customer PCs

---

## 📦 Create Standalone .exe (Optional)

Want a single .exe file that works without Python?

```bash
# Install PyInstaller
pip install pyinstaller

# Create .exe
pyinstaller --onefile --windowed --name "NetworkingUtility" app.py
```

**Result:** `dist/NetworkingUtility.exe` - Share this single file with anyone!

---

## 🎯 Use Cases

### 1. Multiple Device Down Incidents
**Input:**
```
CRITICAL: Multiple devices down
Device details:
router1-192.168.1.1
switch1-10.0.0.1
server1-172.16.0.1
```

**Output:**
```
Total nodes: 3
Up devices: 2
Down devices: 1

→ List of Up devices:
192.168.1.1
10.0.0.1

→ List of Down devices:
172.16.0.1
```

### 2. Interface Down Analysis
Parse Cisco/network device interface alerts and generate troubleshooting commands.

### 3. Quick Command Templates
One-click copy of common troubleshooting commands for device health checks, hardware diagnostics, and more.

---

## 📁 Project Structure

```
networking_utility/
├── app.py              # Python backend for desktop app
├── requirements.txt    # Python dependencies
├── index.html          # Main page (web & desktop)
├── interface.html      # Interface analyzer (web & desktop)
├── filter.js           # JavaScript logic (web & desktop)
├── style.css           # Styling (web & desktop)
├── favicon.png         # Icon
└── README.md           # Documentation
```

**Note:** All HTML/CSS/JS files are used by both:
- **GitHub Pages** (web version)
- **Python Eel** (desktop app)

---

## 🔧 Technical Details

### Technologies
- **Frontend:** HTML5, CSS3, JavaScript (ES6)
- **Styling:** Bootstrap, Font Awesome
- **Desktop Backend:** Python 3.8+, Eel (Python-JS bridge)
- **Ping Execution:** subprocess (cross-platform)

### Browser Compatibility (Web Version)
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox  
- ✅ Safari
- ✅ Opera

### Desktop Requirements
- ✅ Python 3.8 or higher
- ✅ Works on Windows, Mac, Linux
- ✅ No additional installation for .exe version

---

## 📋 Feature Comparison

| Feature | Web Version | Desktop App |
|---------|------------|-------------|
| IP Extraction | ✅ | ✅ |
| Ping Command Generator | ✅ | ✅ |
| Status Analyzer | ✅ | ✅ |
| Interface Parser | ✅ | ✅ |
| Copy Templates | ✅ | ✅ |
| **Auto-Ping Execution** | ❌ | ✅ |
| **Progress Indicator** | ❌ | ✅ |
| **Instant Results** | ❌ | ✅ |
| Cross-Platform | ✅ | ✅ |
| No Installation | ✅ | ❌ (needs Python) |
| Offline Use | ❌ | ✅ |

---

## 🛠️ Development

### Clone & Run Locally
```bash
git clone https://github.com/tnvsai/networking_utility.git
cd networking_utility

# For web version
# Just open index.html in browser

# For desktop app
pip install -r requirements.txt
python app.py
```

### Contributing
Contributions welcome! Please feel free to submit a Pull Request.

---

## ❓ FAQ

### Q: Why doesn't auto-ping work on the web version?
**A:** Browsers block system command execution for security. Auto-ping requires direct ping access, which only works in the desktop app.

### Q: Do I need Python installed to use the desktop app?
**A:** Yes, unless you use the pre-built .exe version (if available in Releases).

### Q: Can I use this on Mac/Linux?
**A:** Yes! The web version works everywhere. The desktop app works on Mac/Linux with Python installed.

### Q: Is this safe to use on corporate networks?
**A:** Yes! All code is open-source and auditable. The desktop app only pings IPs you provide - no external connections.

### Q: How do I deploy the web version to GitHub Pages?
**A:**  
1. Push this repo to GitHub
2. Go to Settings → Pages
3. Select main branch as source
4. Your tool will be live at `https://yourusername.github.io/networking_utility`

---

## 📝 License

This project is open source and available for free use.

---

## 🙏 Credits

Created for network administrators to simplify incident troubleshooting and device monitoring.

---

## 📧 Support

Found a bug or have a feature request? Open an issue on GitHub!

---

**⭐ If this tool helps you, please star the repository!**
