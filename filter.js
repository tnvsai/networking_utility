// ===========================
// NETWORKING UTILITY - FILTER.JS
// Main logic for IP extraction, ping analysis, and interface parsing
// ===========================

// Extract port number from interface name
function get_Interface_Port_Number(interface_Port_Number) {
    if (interface_Port_Number.toLowerCase().startsWith("port-channel")) {
        return interface_Port_Number.substring(12);
    }
    else if (interface_Port_Number.toLowerCase().startsWith("vlan")) {
        return interface_Port_Number;
    }
    else if (interface_Port_Number.match(/\w+(\d+.*)/)) {
        let match = interface_Port_Number.match(/\w+(\d+.*)/);
        return match ? match[1] : interface_Port_Number;
    }
}

var isClickingFirstTime = true;

// Parse interface down alerts and generate summary
function print_all_Interfaces() {
    document.getElementById('result').value = "";
    var currentInput = document.getElementById('description').value.trim();
    var deviceMap = new Map(); // Use Map to group by Node Name

    // Normalize input to handle common typos and inconsistencies
    // Split by newline OR period to handle "Alert 1. Alert 2." on same line
    // Global Regex Approach: Scan entire text for patterns regardless of line breaks

    // Consolidated Global Regex: Handles duplicates, typos, and variations in one pass
    // Structure: (Prefix or Lookahead) (Interface Name) (Divider) (Node Name) (Lookahead End)
    let regexGlobal = /(?:(?:Interfa[cs]es?|Intfs?)\s*:\s*|(?=(?:Port|Pert)\s))(.+?)\s+(?:on|an)\s+Node:\s*([^\n\.]+?)(?=\s*(?:is\s+Down|[\n\.]|$))/gi;

    // Shared processor function (embedded)
    let match;
    while ((match = regexGlobal.exec(currentInput)) !== null) {
        let interfaceName = match[1].trim();
        let rawNode = match[2];

        // Clean up Node Name
        let nodeName = rawNode
            .replace(/[- ]+(?:is|an|31s|3is|6is|IS)(?:[- ]+Downs?)?/i, '')
            .replace(/[- ]+Downs?$/i, '')
            .replace(/[\.,;]+$/, '')
            .replace(/-+$/, '')
            .trim();

        // Fix spaces
        nodeName = nodeName.replace(/\s+/g, '-');
        nodeName = nodeName.toUpperCase();

        if (nodeName.length < 3) continue;

        // Store in Map
        if (!deviceMap.has(nodeName)) {
            deviceMap.set(nodeName, {
                Node_Name: nodeName,
                IP: "N/A",
                Interfaces_Name: [],
                Interface_Port_Number: []
            });
        }
        let deviceObj = deviceMap.get(nodeName);
        deviceObj.Interfaces_Name.push(interfaceName);
        deviceObj.Interface_Port_Number.push(interfaceName);
    }

    // Convert Map back to Array for existing logic compatibility
    deviceBox = Array.from(deviceMap.values());
    let total_Count = deviceBox.reduce((sum, device) => sum + device.Interfaces_Name.length, 0);

    // Build Output
    // Requested Format:
    // Node name: BMA-VT-BPV-COM2-DSW2-3
    // interfaces: 2
    //
    // Port 14
    // Port 13

    let finalOutput = "";

    // Header
    finalOutput += `Total Interfaces Down: ${total_Count} (across ${deviceBox.length} devices)\n\n`;

    deviceBox.forEach((nodeObj, index) => {
        // Separator between devices
        if (index > 0) finalOutput += "\n------------------------------------------------------------\n\n";

        finalOutput += `Node name: ${nodeObj.Node_Name}\n`;
        finalOutput += `Interfaces: ${nodeObj.Interfaces_Name.length}\n\n`;

        nodeObj.Interfaces_Name.forEach(interfaceName => {
            finalOutput += `  ${interfaceName}\n`; // Indented
        });
    });

    document.getElementById('result').value = finalOutput;

    // Clear previous buttons/titles if any
    let titleBtn = document.getElementById('titleButtons');
    if (titleBtn) {
        titleBtn.innerText = "";
    }

    var nodesContainer = document.querySelector('.AllNodeButtons');
    if (nodesContainer) {
        while (nodesContainer.firstChild) {
            nodesContainer.removeChild(nodesContainer.firstChild);
        }
    }

    return deviceBox;
}

// Copy result to clipboard
function copyToClipboard() {
    var result = document.getElementById('result');
    result.select();
    document.execCommand('copy');
    showBanner();
}

// Show copy banner notification
function showBanner() {
    var banner = document.getElementById('banner');
    banner.style.display = 'block';
    setTimeout(function () {
        banner.style.display = 'none';
    }, 500);
}

// Copy predefined command templates
async function copyNodeUpCmd(e) {
    var copy_cmd = e.target.id;

    try {
        cmd_for_resolve = [];
        if (copy_cmd === 'NodeUpCmd') {
            cmd_for_resolve = [' Terminal length 0', ' sh ver | i reload|up', ' sh cdp nei', ' sh env all', ' sh process cpu his', 'sh clo', ''];
        }
        else if (copy_cmd === 'hardwareUpCmd') {
            cmd_for_resolve = [' Terminal length 0', ' sh env all', ' sh logg | i fan', ' sh logg | i temp', ' sh logg | i power ', 'sh clo', ''];
        }
        else if (copy_cmd === 'CPU_Cmd') {
            cmd_for_resolve = [' Terminal length 0', ' sh process cpu his ', 'sh clo', ''];
        }
        else if (copy_cmd === 'Node_Resolution_template') {
            cmd_for_resolve =
                ['1.', 'Reason for Outage(RFO): Power issue', 'Impact:  ', 'Resolution Steps: ', ' -  Power restored. ', ' -  Device is up and stable. ', ' Hence proceeding to closure of this incident. ', '_______________________________________________________________', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: Power issue', 'Reason for Outage (RFO): The device went down due to a power issue', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
        }
        else if (copy_cmd === 'Hardware_Resolution_template') {
            cmd_for_resolve = ['1.', 'Reason for Outage(RFO): Hardware  was down due to power issue', 'Impact:  ', 'Resolution Steps: ', '--- Hardware status of the device is  working fine.', '--- Hence proceeding to closure of this incident.', '_______________________________________________________________', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: Power issue', 'Reason for Outage (RFO): Hardware of the device was down due to power issue', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
        }
        else if (copy_cmd === 'Interface_Resolution_template') {
            cmd_for_resolve = ['1.', 'Reason for Outage(RFO): Interface is down maybe due to neighbour device is down.', 'Impact:  ', 'Resolution Steps:', '--Interface is up.', '--Hence, proceding to close the incident.', ' ', '_______________________________________________________________', ' ', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: Power issue', 'Reason for Outage (RFO): Interface is down maybe due to neighbour device is down', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
        }
        else if (copy_cmd === 'CPU_Load_Resolution_template') {
            cmd_for_resolve = ['1.', 'Reason for Outage(RFO): High CPU utilization', 'Impact:  ', 'Resolution Steps: ', '---CPU load is below 80% and utilization is normal.', '--- Hence proceeding to close the incident.', '_______________________________________________________________', ' ', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: High CPU Load', 'Reason for Outage (RFO): CPU Load was above 80%', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
        }
        else if (copy_cmd === 'Village_Resolution_template') {
            cmd_for_resolve = [
                'Customer Name:',
                '',
                'SLA: NA',
                '',
                'SLA Breached Reason:',
                '',
                'Issue Description:',
                '',
                'Resolution Steps:',
                ' - User length of stay has completed',
                ' - Hence, Proceeding to close the incident',
                '',
                'Fix Actions Taken: Yes',
                '',
                'Customer Confirmed Normal Operation & RFO Awareness: NA'
            ];
        }
        else {
            cmd_for_resolve = ['No Text Copied!']
        }

        let finalCmd = cmd_for_resolve.join('\n');
        await navigator.clipboard.writeText(finalCmd);

        // Show in Output window as requested
        document.getElementById('result').value = finalCmd;

        showBanner();
    } catch (error) {
        console.error('Error copying text: ', error);
    }
}

// Create buttons for each node/device
function createNodesButtons(Nodes) {
    var nodesContainer = document.querySelector('.AllNodeButtons');
    while (nodesContainer.firstChild) {
        nodesContainer.removeChild(nodesContainer.firstChild);
    }

    var numberOfButtons = Nodes.length;

    for (let i = 0; i < numberOfButtons; i++) {
        var button = document.createElement('button');
        var portNo = document.createElement('button');

        button.type = 'button';
        portNo.type = 'button';

        button.innerHTML = Nodes[i].Node_Name + '-' + Nodes[i].IP;
        portNo.innerHTML = "Status";
        portNo.style.color = 'lightgreen';

        // Copy interface commands
        button.addEventListener('click', function (Nodes) {
            return function () {
                selectedButton(button, Nodes[i].Interfaces_Name, Nodes[i].Interfaces_Name.length);
            }
        }(Nodes));

        // Copy status command
        portNo.addEventListener('click', function (Nodes) {
            return function () {
                portNumberselectedButton(portNo, Nodes[i].Node_Name, Nodes[i].Interface_Port_Number, Nodes[i].Interface_Port_Number.length);
            }
        }(Nodes));

        nodesContainer.appendChild(button);
        nodesContainer.appendChild(portNo);
    }
}

// Copy detailed interface commands
async function selectedButton(button, Interfaces_Name, numberOfInterfaces) {
    var INTF_CMD_TextToCopy = ''
    for (var j = 0; j < numberOfInterfaces; j++) {
        let interfaceName = Interfaces_Name[j];
        let lineBreak = ' \n\n ';
        let cmd1 = ' sh ' + interfaceName + '\n';
        let cmd2 = ' sh run ' + interfaceName + '\n';
        let cmd3 = ' sh logg | i ' + interfaceName.substr(interfaceName.indexOf(" ") + 1) + '\n';
        INTF_CMD_TextToCopy += cmd1 + lineBreak + cmd2 + lineBreak + cmd3 + lineBreak + lineBreak + lineBreak;
    }

    INTF_CMD_TextToCopy = ' Terminal length 0 ' + '\n' + INTF_CMD_TextToCopy;

    try {
        await navigator.clipboard.writeText(INTF_CMD_TextToCopy);

        var span = document.createElement('span');
        span.textContent = ' Detailed command copied for ' + numberOfInterfaces + ' interfaces';
        span.style.color = 'white';
        span.style.backgroundColor = 'blue';
        span.style.border = '3px solid green';
        span.style.padding = '5px';
        span.style.marginLeft = '10px';
        span.style.borderRadius = '5px';
        span.style.position = 'fixed';
        span.style.top = '0';
        span.style.left = '50%';
        span.style.transform = 'translate(-50%, 0)';
        span.style.zIndex = '1000';

        document.body.appendChild(span);

        setTimeout(function () {
            span.remove();
        }, 2000);
    } catch (error) {
        console.error('Error copying text: ', error);
    }
}

// Copy port status command
async function portNumberselectedButton(portNumberButton, Node_Name, Interfaces_Ports_No, numberOfInterfaces) {
    var portNo = '';
    var showIp = 'sh ip int br | i ';

    for (var j = 0; j < numberOfInterfaces; j++) {
        if (j === numberOfInterfaces - 1) {
            portNo = Interfaces_Ports_No[j] + ' ';
            showIp += portNo;
            break;
        }
        portNo = Interfaces_Ports_No[j] + ' |';
        showIp += portNo;
    }

    var STATUS = showIp;
    showIp = '';

    try {
        await navigator.clipboard.writeText(STATUS);

        var span = document.createElement('span');
        span.innerHTML = `Copied command- Get up/down status of ${numberOfInterfaces} interfaces for the device - <strong>${Node_Name}<strong/>`;
        span.style.color = 'lightgreen';
        span.style.backgroundColor = 'black';
        span.style.border = '3px solid white';
        span.style.padding = '4px';
        span.style.font = 'bold'
        span.style.marginLeft = '5px';
        span.style.borderRadius = '5px';
        span.style.backgroundcolor = '#4CAF50';
        span.style.position = 'fixed';
        span.style.top = '0';
        span.style.left = '50%';
        span.style.transform = 'translate(-50%, 0)';
        span.style.zIndex = '1000';

        document.body.appendChild(span);

        setTimeout(function () {
            span.remove();
        }, 3000);
    } catch (error) {
        console.error('Error copying text: ', error);
    }
}

// Check if text contains valid IP address
function isIP_Found(currentInput) {
    let ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    let matches = currentInput.match(ipPattern);

    if (matches === null) {
        return false;
    }
    else {
        return matches[0];
    }
}

// Extract unique IPs and generate ping commands
function print_all_IPs() {
    document.getElementById('result').value = "";
    var currentInput = document.getElementById('description').value.trim();
    let IP_Box = "";
    let IP_array = [];

    let word = currentInput.replace(/\n/g, " ").split(' ')

    // Extract all IPs
    word.forEach(function (device) {
        if (isIP_Found(device) !== false) {
            IP_array.push(isIP_Found(device));
        }
    })

    // Get unique IPs
    let s = new Set(IP_array);
    let unique_IPs = [...s];

    unique_IPs.forEach(function (ip) {
        let cmd = 'ping ' + ip + '\n';
        IP_Box += cmd;
    })

    if (unique_IPs.length === 0) {
        document.getElementById('result').value = "No IP found";
        showBanner_IP(unique_IPs.length);
        return;
    }

    showBanner_IP(unique_IPs.length);
    document.getElementById('result').value = IP_Box;

    var result = document.getElementById('result');
    result.select();
    document.execCommand('copy');
}

// Analyze ping output and show UP/DOWN devices
function filter_node_Up_Down() {
    document.getElementById('result').value = "";
    pingedIP = false;
    var currentInput = document.getElementById('description').value.trim();
    let results = [];
    let deviceMapping = {}; // Store device name -> IP mapping
    let lines = currentInput.split('\n');
    let currentIP = null;

    // First pass: Extract device names from input
    let currentDeviceName = null;
    lines.forEach(line => {
        let trimmedLine = line.trim();

        // Format 1: "Device: AU-JIM-EPCR-WAP16" (from auto-ping output)
        if (trimmedLine.startsWith('Device:')) {
            currentDeviceName = trimmedLine.substring(7).trim();
        }
        // Format 2: "IP: 192.168.55.104" (from auto-ping output)
        else if (trimmedLine.startsWith('IP:') && currentDeviceName) {
            let ip = trimmedLine.substring(3).trim();
            deviceMapping[ip] = currentDeviceName;
            currentDeviceName = null;
        }
        // Format 3: "AU-JIM-EPCR-WAP16-192.168.55.104" (original device list)
        else if (trimmedLine &&
            !trimmedLine.includes('Pinging') &&
            !trimmedLine.includes('Reply') &&
            !trimmedLine.includes('Packets:') &&
            !trimmedLine.includes('Ping statistics') &&
            !trimmedLine.includes('Approximate') &&
            !trimmedLine.includes('bytes of data') &&
            !trimmedLine.includes('Minimum') &&
            !trimmedLine.includes('===') &&
            !trimmedLine.includes('TTL=') &&
            !trimmedLine.includes('> ping') && // Exclude prompt
            !trimmedLine.startsWith('PS ')) {

            let ip = isIP_Found(trimmedLine);
            if (ip !== false) {
                // Extract device name (everything before the IP)
                let ipIndex = trimmedLine.indexOf(ip);
                if (ipIndex > 0) {
                    let deviceName = trimmedLine.substring(0, ipIndex).trim();
                    deviceName = deviceName.replace(/-$/, '').trim();
                    if (deviceName && deviceName.length > 2) {
                        deviceMapping[ip] = deviceName;
                    }
                }
            }
        }


        // Format 4: "PS ...> ping 1.2.3.4" (Raw Terminal Prompt)
        // Even without the device name comment, we should recognize this line as containing the IP.
        let psMatch = trimmedLine.match(/PS\s+.*>\s*ping\s+(\d+\.\d+\.\d+\.\d+)/i);
        if (psMatch) {
            let ipInLine = psMatch[1];
            if (ipInLine) {
                // If we have a pending device name from a previous header, map it.
                if (currentDeviceName) {
                    deviceMapping[ipInLine] = currentDeviceName;
                    currentDeviceName = null;
                } else {
                    // Just mark this IP as present so we can track it later
                    // (If no device name found, it will just show as null in final results)
                }
            }
        }
    });

    // Second pass: Parse ping output
    lines.forEach(line => {
        let ipMatch = line.match(/Pinging (\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
            currentIP = ipMatch[1];
        }

        let lossMatch = line.match(/Lost = \d+ \((\d+%) loss\)/);
        if (lossMatch && currentIP) {
            pingedIP = true;
            results.push({ IP: currentIP, loss: lossMatch[1], device: deviceMapping[currentIP] || null });
            currentIP = null;
        }
    });

    if (pingedIP === false) {
        document.getElementById('result').value = "No ping output detected!\n\nTo use this feature:\n1. Click 'Generate Ping Commands'\n2. Copy and run the commands in your terminal\n3. Copy the ENTIRE terminal output\n4. Paste it here and click 'Analyze Ping Results' again";
        return;
    }

    if (results.length === 0) {
        document.getElementById('result').value = "No input found";
        return;
    }

    let listOfUP_node = getUpCounts(results);
    let listOfDOWN_node = getDownCounts(results);

    var res = "\n";
    res += "Total nodes count: " + results.length + '\n';
    res += "Up devices: " + listOfUP_node.upCount + '\n';
    res += "Down devices: " + listOfDOWN_node.downCount + '\n';
    res += '\n';
    res += "-------> List of " + listOfUP_node.upCount + " Up devices" + '\n';
    res += listOfUP_node.up_IP_list + '\n'
    res += "====================================" + '\n'
    res += "-------> List of " + listOfDOWN_node.downCount + " Down devices" + '\n';
    res += listOfDOWN_node.down_IP_list + '\n\n'

    document.getElementById('result').value = res;

    var result = document.getElementById('result');
    result.select();
    document.execCommand('copy');
}

// Count and list DOWN devices
function getDownCounts(ip_obj) {
    let count = 0;
    let DOWN_IP = "";

    ip_obj.forEach(function (obj, index) {
        if (obj.loss === "100%" || obj.loss !== "0%") {
            count++;
            if (obj.device) {
                DOWN_IP += obj.device + " - " + obj.IP + "\n";
            } else {
                DOWN_IP += obj.IP + "\n";
            }
        }
    })

    return { "down_IP_list": DOWN_IP, "downCount": count };
}

// Count and list UP devices
function getUpCounts(ip_obj) {
    let count = 0;
    let UP_IP = "";

    ip_obj.forEach(function (obj, index) {
        if (obj.loss === "0%") {
            count++;
            if (obj.device) {
                UP_IP += obj.device + " - " + obj.IP + "\n";
            } else {
                UP_IP += obj.IP + "\n";
            }
        }
    })

    return { "up_IP_list": UP_IP, "upCount": count };
}

// Show IP count banner
function showBanner_IP(iplength) {
    var span = document.createElement('span');
    span.innerHTML = `${iplength} IP`;
    span.className = 'ip-banner';

    document.body.appendChild(span);

    setTimeout(function () {
        span.remove();
    }, 20000);
}

// Switch between pages
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// ===========================
// AUTO PING (Python Eel)
// ===========================

// Exposed to Python for progress updates
eel.expose(update_ping_progress);
function update_ping_progress(current, total, current_ip) {
    updatePingStatus(`Pinging ${current_ip}...`, current, total);
}

// Main auto-ping function
async function autoPingIPs() {
    // Check if Eel is available (Desktop App)
    if (typeof eel === 'undefined') {
        alert("⚠️ Feature Not Available in Browser\n\nAuto-Ping requires access to the system terminal, which browsers block for security.\n\nPlease use the desktop app (run_app.bat) for this feature.\n\nFor now, click 'Generate Ping Commands' instead!");
        return;
    }

    document.getElementById('result').value = "";

    var currentInput = document.getElementById('description').value.trim();
    if (!currentInput) {
        alert("Please enter text containing IP addresses first!");
        return;
    }

    IP_array = [];
    let deviceMapping = {}; // Store device name -> IP mapping
    let lines = currentInput.split('\n');

    // Extract IPs and device names
    lines.forEach(function (line) {
        let trimmedLine = line.trim();
        if (trimmedLine) {
            let ip = isIP_Found(trimmedLine);
            if (ip !== false) {
                IP_array.push(ip);

                // Extract device name (everything before the IP)
                let ipIndex = trimmedLine.indexOf(ip);
                if (ipIndex > 0) {
                    let deviceName = trimmedLine.substring(0, ipIndex).trim();
                    // Remove trailing dash or hyphen
                    deviceName = deviceName.replace(/-$/, '').trim();
                    if (deviceName) {
                        deviceMapping[ip] = deviceName;
                    }
                }
            }
        }
    });

    let s = new Set(IP_array);
    let unique_IPs = [...s];

    if (unique_IPs.length === 0) {
        document.getElementById('result').value = "No IP addresses found in input!";
        return;
    }

    // Show progress modal
    showPingProgress(true);
    updatePingStatus(`Found ${unique_IPs.length} unique IP addresses. Starting ping...`, 0, unique_IPs.length);

    try {
        // Call Python backend
        let results = await eel.ping_multiple_ips(unique_IPs, 4, 10)();
        processPingResults(results, deviceMapping);
    } catch (error) {
        showPingProgress(false);
        alert("Error executing ping: " + error.message);
        console.error("Ping execution error:", error);
    }
}

// Show/hide progress modal
function showPingProgress(show) {
    let progressEl = document.getElementById('pingProgress');
    if (progressEl) {
        progressEl.style.display = show ? 'block' : 'none';
    }
}

// Update progress status
function updatePingStatus(message, current, total) {
    let statusEl = document.getElementById('pingStatus');
    if (statusEl) {
        statusEl.innerText = message;
    }

    if (total > 0) {
        let percentage = Math.round((current / total) * 100);

        let progressBarEl = document.getElementById('pingProgressBar');
        if (progressBarEl) {
            progressBarEl.style.width = percentage + '%';
        }

        let percentageEl = document.getElementById('pingPercentage');
        if (percentageEl) {
            percentageEl.innerText = percentage + '%';
        }

        let detailsEl = document.getElementById('pingDetails');
        if (detailsEl) {
            detailsEl.innerText = `Completed: ${current} / ${total}`;
        }
    }
}

// Utility functions for UI buttons
function copyText(elementId) {
    var copyText = document.getElementById(elementId);
    if (!copyText) return;

    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
    document.execCommand("copy");

    // Optional: Visual feedback could be added here
}

function clearText(elementId) {
    if (confirm('Are you sure you want to clear this text?')) {
        document.getElementById(elementId).value = "";
    }
}

async function pasteText(elementId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(elementId).value = text;
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        alert('Failed to read clipboard. Please check permissions or use Ctrl+V.');
    }
}

// Process and display ping results
function processPingResults(results, deviceMapping = {}) {
    updatePingStatus("Processing results...", results.length, results.length);

    if (results.length === 0) {
        document.getElementById('result').value = "Error: Could not parse ping results.";
        showPingProgress(false);
        return;
    }

    // Build detailed output
    var detailedOutput = "";

    results.forEach((result, index) => {
        // Header Block
        detailedOutput += "====================================\n";

        let deviceName = deviceMapping[result.ip];
        if (deviceName) {
            detailedOutput += `Device: ${deviceName}\n`;
            detailedOutput += `IP: ${result.ip}\n`;
        } else {
            detailedOutput += `Pinging ${result.ip}\n`;
        }

        detailedOutput += "====================================\n\n";

        if (result.full_output) {
            let finalOutput = result.full_output;

            detailedOutput += finalOutput + "\n\n";
        } else {
            detailedOutput += `No output available for ${result.ip}\n\n`;
        }
    });

    document.getElementById('result').value = detailedOutput;

    // Async copy using Clipboard API
    // Note: Browsers may block this if the window isn't focused or if the event isn't direct
    // We try our best and notify if it fails.
    navigator.clipboard.writeText(detailedOutput).then(function () {
        showBanner();
    }).catch(function (err) {
        console.warn('Auto-copy failed (browser restriction):', err);
        // Fallback or just let the user know
        // We don't alert to avoid annoyance, but we could highlight the copy button
        // For now, let's just make sure the user sees the result.

        // Try fallback just in case
        var resultEl = document.getElementById('result');
        resultEl.select();
        try {
            document.execCommand('copy');
            showBanner();
        } catch (e) {
            console.error('Fallback copy failed too', e);
            alert("Auto-copy blocked by browser. Please click the 'Copy' button manually.");
        }
    });

    // Hide progress
    setTimeout(function () {
        showPingProgress(false);
    }, 1000);
}

// ===========================
// THEME SWITCHER
// ===========================

function toggleTheme() {
    const body = document.body;
    const checkbox = document.getElementById('checkbox');

    // Logic Reversed: Checked (ON) = Night Mode (Default Dark CSS)
    // Unchecked (OFF) = Day Mode (Light Mode CSS Override)
    if (checkbox.checked) {
        body.classList.remove('light-mode'); // Enable Dark (remove override)
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-mode'); // Enable Light
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', (event) => {
    const currentTheme = localStorage.getItem('theme');
    const checkbox = document.getElementById('checkbox');

    // Default to Dark Mode (Switch ON) if null or 'dark'
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
        if (checkbox) checkbox.checked = false; // Switch OFF for Light
    } else {
        document.body.classList.remove('light-mode');
        if (checkbox) checkbox.checked = true; // Switch ON for Dark
    }
});
// ===========================
// QUICK NOTES FEATURE
// ===========================

let notesDebounceTimer;

function toggleNotes() {
    let modal = document.getElementById('notesModal');
    if (modal.style.display === 'none') {
        modal.style.display = 'flex';
        // Focus cursor at end
        let area = document.getElementById('quickNotesArea');
        area.focus();
    } else {
        modal.style.display = 'none';
    }
}

// Auto-save logic
document.addEventListener('DOMContentLoaded', () => {
    // Load notes on startup (Async with Retries)
    setTimeout(async () => {
        if (typeof eel !== 'undefined' && eel.load_notes) {
            try {
                let content = await eel.load_notes()();
                if (content && content.length > 0) {
                    document.getElementById('quickNotesArea').innerHTML = content;
                }
            } catch (e) {
                console.error("Failed to load notes:", e);
            }
        }
    }, 500); // Wait 500ms for Eel connection to stabilize

    // Save on typing (Debounced)
    document.getElementById('quickNotesArea').addEventListener('input', () => {
        let status = document.getElementById('saveStatus');
        status.innerText = "Saving...";

        clearTimeout(notesDebounceTimer);
        notesDebounceTimer = setTimeout(() => {
            let content = document.getElementById('quickNotesArea').innerHTML;
            if (typeof eel !== 'undefined' && eel.save_notes) {
                eel.save_notes(content)((success) => {
                    status.innerText = success ? "Saved" : "Error Saving";
                    setTimeout(() => status.innerText = "Saved", 2000);
                });
            } else {
                status.innerText = "Restart App to Save";
            }
        }, 1000); // Save after 1 second of inactivity
    });
    // Make Notes Draggable
    makeElementDraggable(document.getElementById("notesModal"));
});

// Color Switcher Logic
// Color Switcher Logic
function setNoteColor(bgColor, headerColor) {
    let selection = window.getSelection();
    let noteArea = document.getElementById("quickNotesArea");

    // Check if text is selected inside the notes area
    if (selection.rangeCount > 0 && selection.toString().length > 0 && noteArea.contains(selection.anchorNode)) {
        // Change Text Color
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, headerColor);
    } else {
        // Change Background Color (Default)
        let modal = document.getElementById("notesModal");
        let header = modal.querySelector("div");

        if (modal) modal.style.background = bgColor;
        if (header) {
            header.style.background = headerColor;
            header.style.borderBottom = `1px solid ${headerColor}`;
        }
    }
}

// Clear Notes Logic
function clearNotes() {
    if (confirm("Are you sure you want to clear all notes?")) {
        let area = document.getElementById('quickNotesArea');
        area.value = "";
        // Trigger save immediately
        if (typeof eel !== 'undefined' && eel.save_notes) {
            eel.save_notes("")((success) => {
                let status = document.getElementById('saveStatus');
                status.innerText = "Cleared";
            });
        }
    }
}

// Drag Helper
function makeElementDraggable(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    // Move on header click
    if (elmnt.querySelector("div")) {
        elmnt.querySelector("div").onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set element's new position
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        // Remove 'right' content to allow free movement
        elmnt.style.right = "auto";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
