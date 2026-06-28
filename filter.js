// ===========================
// NETWORKING UTILITY - FILTER.JS
// Main logic for IP extraction, ping analysis, and interface parsing
// ===========================

// Copy text to the clipboard using the modern API, falling back to the
// legacy execCommand approach (and the result box) if it isn't available.
function copyToClipboardText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () {
            legacyCopyResultBox();
        });
    }
    legacyCopyResultBox();
    return Promise.resolve();
}

function legacyCopyResultBox() {
    var result = document.getElementById('result');
    if (!result) return;
    result.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        console.error('Clipboard copy failed:', e);
    }
}

// Escape text before injecting into the result panel (device names come from user input)
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Hide the color-coded summary panel (used by non-ping features)
function hideResultPanel() {
    let panel = document.getElementById('resultPanel');
    if (panel) {
        panel.style.display = 'none';
        panel.innerHTML = '';
    }
}

// Render a color-coded UP/DOWN summary above the raw output
function renderResultPanel(upList, downList) {
    let panel = document.getElementById('resultPanel');
    if (!panel) return;

    let total = upList.length + downList.length;
    if (total === 0) {
        hideResultPanel();
        return;
    }

    function buildList(items) {
        if (items.length === 0) {
            return '<div class="empty-note">None</div>';
        }
        return '<ul>' + items.map(function (i) {
            return '<li>' + escapeHtml(i) + '</li>';
        }).join('') + '</ul>';
    }

    panel.innerHTML =
        '<div class="stats-row">' +
        '<div class="stat-chip total">Total<b>' + total + '</b></div>' +
        '<div class="stat-chip up">Up<b>' + upList.length + '</b></div>' +
        '<div class="stat-chip down">Down<b>' + downList.length + '</b></div>' +
        '</div>' +
        '<div class="status-cols">' +
        '<div class="status-col up-col"><h4>Up (' + upList.length + ')</h4>' + buildList(upList) + '</div>' +
        '<div class="status-col down-col"><h4>Down (' + downList.length + ')</h4>' + buildList(downList) + '</div>' +
        '</div>';

    panel.style.display = 'block';
}

// Toggle busy/disabled state across the UI during auto-ping
var pingInProgress = false;
var pingAbortRequested = false;

function setButtonsBusy(isBusy) {
    pingInProgress = isBusy;

    var form = document.getElementById('mainForm');
    if (form) {
        form.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    }

    document.querySelectorAll('.button-container button:not(#autoPingBtn)').forEach(function (btn) {
        btn.disabled = isBusy;
    });

    document.querySelectorAll('.cool-button, .action-btn, .quick-notes-btn, .theme-opt').forEach(function (btn) {
        btn.disabled = isBusy;
    });

    var toolbarToggle = document.getElementById('toolbarToggle');
    if (toolbarToggle) {
        toolbarToggle.disabled = isBusy;
    }

    var autoBtn = document.getElementById('autoPingBtn');
    if (autoBtn) {
        if (isBusy) {
            if (!autoBtn.dataset.label) {
                autoBtn.dataset.label = autoBtn.innerHTML;
            }
            autoBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Ping';
            autoBtn.disabled = false;
            autoBtn.classList.add('ping-stop-mode');
            autoBtn.setAttribute('aria-label', 'Stop auto-ping');
        } else if (autoBtn.dataset.label) {
            autoBtn.innerHTML = autoBtn.dataset.label;
            delete autoBtn.dataset.label;
            autoBtn.disabled = false;
            autoBtn.classList.remove('ping-stop-mode');
            autoBtn.setAttribute('aria-label', 'Auto-ping all IPs in input');
        }
    }

    var stopModalBtn = document.getElementById('stopPingBtn');
    if (stopModalBtn) {
        stopModalBtn.disabled = !isBusy;
        if (!isBusy) {
            stopModalBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Ping';
        }
    }

    var progressEl = document.getElementById('pingProgress');
    if (progressEl) {
        progressEl.setAttribute('aria-hidden', isBusy ? 'false' : 'true');
    }
}

// Return every IPv4 address found anywhere in free-form text (global scan)
function extractAllIPs(text) {
    if (!text) {
        return [];
    }
    var octet = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
    var ipPattern = new RegExp('\\b' + octet + '(?:\\.' + octet + '){3}\\b', 'g');
    return text.match(ipPattern) || [];
}

// Unique IPs preserving first-seen order — single source of truth for all features
function extractUniqueIPs(text) {
    return [...new Set(extractAllIPs(text))];
}

// Count unique IPv4 addresses in free-form text (same logic as Generate Ping Commands)
function countUniqueIPs(text) {
    return extractUniqueIPs(text).length;
}

function updateIpCountBadge() {
    var badge = document.getElementById('ipCountBadge');
    var textarea = document.getElementById('description');
    if (!badge || !textarea) {
        return;
    }

    var count = countUniqueIPs(textarea.value);
    badge.textContent = count === 1 ? '1 IP detected' : count + ' IPs detected';
    badge.classList.toggle('ip-count-badge--empty', count === 0);
    badge.classList.toggle('ip-count-badge--ready', count > 0);
}

function initIpCountWatcher() {
    var textarea = document.getElementById('description');
    if (!textarea) {
        return;
    }

    textarea.addEventListener('input', updateIpCountBadge);
    textarea.addEventListener('paste', function () {
        setTimeout(updateIpCountBadge, 0);
    });
    updateIpCountBadge();
}

function toggleToolbar(forceExpanded) {
    var section = document.getElementById('toolbarSection');
    var toggle = document.getElementById('toolbarToggle');
    if (!section || !toggle) {
        return;
    }

    var expanded = typeof forceExpanded === 'boolean'
        ? forceExpanded
        : section.classList.contains('collapsed');

    section.classList.toggle('collapsed', !expanded);
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    localStorage.setItem('toolbarExpanded', expanded ? '1' : '0');
}

function initToolbar() {
    var expanded = localStorage.getItem('toolbarExpanded') === '1';
    toggleToolbar(expanded);
}

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
    let deviceBox = Array.from(deviceMap.values());
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

    // Interface analysis is text-only; hide the ping summary panel
    hideResultPanel();

    return deviceBox;
}

// Show copy banner notification
function showBanner() {
    var banner = document.getElementById('banner');
    banner.classList.add('banner-visible');
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(function () {
        banner.classList.remove('banner-visible');
    }, 1500);
}

// Copy predefined command templates
async function copyNodeUpCmd(e) {
    // Use currentTarget so clicking the inner hovertext span still resolves
    // to the button's id rather than an empty/incorrect target.
    var copy_cmd = e.currentTarget.id;

    try {
        let cmd_for_resolve = [];
        if (copy_cmd === 'NodeUpCmd') {
            cmd_for_resolve = [' Terminal length 0', ' sh ver | i reload|up', ' sh cdp nei', ' sh env all', ' sh process cpu his', 'sh clo', ''];
        }
        else if (copy_cmd === 'hardwareUpCmd') {
            cmd_for_resolve = [' Terminal length 0', ' sh env all', ' sh logg | i fan', ' sh logg | i temp', ' sh logg | i power ', 'sh clo', ''];
        }
        else if (copy_cmd === 'Node_Resolution_template') {
            cmd_for_resolve =
                ['1.', 'Reason for Outage(RFO): Power issue', 'Impact:  ', 'Resolution Steps: ', ' -  Power restored. ', ' -  Device is up and stable. ', ' Hence proceeding to closure of this incident. ', '_______________________________________________________________', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: Power issue', 'Reason for Outage (RFO): The device went down due to a power issue', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
        }
        else if (copy_cmd === 'Hardware_Resolution_template') {
            cmd_for_resolve = ['1.', 'Reason for Outage(RFO): Hardware  was down due to power issue', 'Impact:  ', 'Resolution Steps: ', '--- Hardware status of the device is  working fine.', '--- Hence proceeding to closure of this incident.', '_______________________________________________________________', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: Power issue', 'Reason for Outage (RFO): Hardware of the device was down due to power issue', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
        }
        else if (copy_cmd === 'Interface_Resolution_template') {
            cmd_for_resolve = ['1.', 'Reason for Outage(RFO): Interface is down maybe due to neighbour device is down.', 'Impact:  ', 'Resolution Steps:', '--Interface is up.', '--Hence, proceeding to close the incident.', ' ', '_______________________________________________________________', ' ', '2.', 'SLA: Met', 'Breached Reason: NA', 'Vendor/Telco Details: NA', 'Case No: NA', 'Incident Category: Power issue', 'Reason for Outage (RFO): Interface is down maybe due to neighbour device is down', 'Service(s) Impacted: LAN services', 'Impact:  ', 'Customer confirmation on RFO awareness: No', 'Customer confirmation on restoration of normal operations: No'];
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

// Check if text contains a valid IPv4 address (octets 0-255) and return it
function isIP_Found(currentInput) {
    let octet = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
    let ipPattern = new RegExp('\\b' + octet + '(?:\\.' + octet + '){3}\\b');
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
    hideResultPanel();
    var currentInput = document.getElementById('description').value.trim();

    let unique_IPs = extractUniqueIPs(currentInput);

    if (unique_IPs.length === 0) {
        document.getElementById('result').value = "No IP found";
        showBanner_IP(0);
        return;
    }

    let IP_Box = unique_IPs.map(function (ip) { return 'ping ' + ip; }).join('\n') + '\n';

    showBanner_IP(unique_IPs.length);
    document.getElementById('result').value = IP_Box;

    copyToClipboardText(IP_Box);
}

// Analyze ping output and show UP/DOWN devices
function filter_node_Up_Down() {
    document.getElementById('result').value = "";
    hideResultPanel();
    let pingedIP = false;
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

    // Second pass: Parse ping output (handles both Windows and Unix/macOS formats)
    lines.forEach(line => {
        // Identify which IP is currently being pinged.
        // Windows: "Pinging x.x.x.x" | Unix: "PING x.x.x.x" | prompt: "...> ping x.x.x.x"
        let ipMatch = line.match(/Pinging (\d+\.\d+\.\d+\.\d+)/)
            || line.match(/PING (\d+\.\d+\.\d+\.\d+)/)
            || line.match(/>\s*ping\s+(\d+\.\d+\.\d+\.\d+)/i);
        if (ipMatch) {
            currentIP = ipMatch[1];
        }

        // Extract packet loss percentage.
        // Windows: "Lost = N (X% loss)" | Unix/macOS: "X% packet loss" (may be decimal)
        let lossNum = null;
        let winLoss = line.match(/Lost = \d+ \((\d+)% loss\)/);
        let nixLoss = line.match(/([\d.]+)% packet loss/);
        if (winLoss) {
            lossNum = parseFloat(winLoss[1]);
        } else if (nixLoss) {
            lossNum = parseFloat(nixLoss[1]);
        }

        if (lossNum !== null && !isNaN(lossNum) && currentIP) {
            pingedIP = true;
            let lossStr = lossNum === 0 ? "0%" : Math.round(lossNum) + "%";
            results.push({ IP: currentIP, loss: lossStr, device: deviceMapping[currentIP] || null });
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

    // Color-coded summary panel
    let upArr = results
        .filter(function (r) { return r.loss === "0%"; })
        .map(function (r) { return r.device ? r.device + " - " + r.IP : r.IP; });
    let downArr = results
        .filter(function (r) { return r.loss !== "0%"; })
        .map(function (r) { return r.device ? r.device + " - " + r.IP : r.IP; });
    renderResultPanel(upArr, downArr);

    copyToClipboardText(res);
}

// Count and list DOWN devices
function getDownCounts(ip_obj) {
    let count = 0;
    let DOWN_IP = "";

    ip_obj.forEach(function (obj, index) {
        if (obj.loss !== "0%") {
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

// ===========================
// AUTO PING (Python Eel)
// ===========================

// Exposed to Python for progress updates (guard: eel.js must load first)
if (typeof eel !== 'undefined') {
    eel.expose(update_ping_progress);
}
function update_ping_progress(current, total, current_ip) {
    if (pingAbortRequested) {
        return;
    }
    updatePingStatus('Pinging ' + current_ip + '...', current, total);
}

// Main auto-ping function
async function autoPingIPs() {
    if (pingInProgress) {
        return stopAutoPing();
    }

    // Check if Eel is available (Desktop App)
    if (typeof eel === 'undefined') {
        alert("⚠️ Feature Not Available in Browser\n\nAuto-Ping requires access to the system terminal, which browsers block for security.\n\nPlease use the desktop app (run_app.bat) for this feature.\n\nFor now, click 'Generate Ping Commands' instead!");
        return;
    }

    document.getElementById('result').value = "";
    hideResultPanel();

    var currentInput = document.getElementById('description').value.trim();
    if (!currentInput) {
        alert("Please enter text containing IP addresses first!");
        return;
    }

    let deviceMapping = {};
    let lines = currentInput.split('\n');

    // Map a device name (leading text on a line) to the first IP on that line
    lines.forEach(function (line) {
        let trimmedLine = line.trim();
        if (!trimmedLine) {
            return;
        }
        let ip = isIP_Found(trimmedLine);
        if (ip !== false) {
            let ipIndex = trimmedLine.indexOf(ip);
            if (ipIndex > 0) {
                let deviceName = trimmedLine.substring(0, ipIndex).trim();
                deviceName = deviceName.replace(/-$/, '').trim();
                if (deviceName) {
                    deviceMapping[ip] = deviceName;
                }
            }
        }
    });

    // Ping every unique IP in the input (matches the live "IPs detected" badge)
    let unique_IPs = extractUniqueIPs(currentInput);

    if (unique_IPs.length === 0) {
        document.getElementById('result').value = "No IP addresses found in input!";
        return;
    }

    pingAbortRequested = false;
    setButtonsBusy(true);
    showPingProgress(true);
    updatePingStatus('Found ' + unique_IPs.length + ' unique IP addresses. Starting ping...', 0, unique_IPs.length);

    try {
        let response = await eel.ping_multiple_ips(unique_IPs, 4, 10)();
        if (pingAbortRequested) {
            return;
        }
        let results = Array.isArray(response) ? response : (response.results || []);
        let cancelled = response.cancelled || false;
        if (cancelled) {
            return;
        }
        processPingResults(results, deviceMapping);
    } catch (error) {
        if (pingAbortRequested) {
            return;
        }
        showPingProgress(false);
        setButtonsBusy(false);
        alert("Error executing ping: " + error.message);
        console.error("Ping execution error:", error);
    }
}

function stopAutoPing() {
    if (!pingInProgress || typeof eel === 'undefined') {
        return;
    }

    pingAbortRequested = true;

    // Reset UI immediately — user does not want partial results
    showPingProgress(false);
    setButtonsBusy(false);
    hideResultPanel();

    var progressBar = document.getElementById('pingProgressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    var percentageEl = document.getElementById('pingPercentage');
    if (percentageEl) {
        percentageEl.innerText = '0%';
    }

    // Kill all ping subprocesses on the backend (fire-and-forget)
    try {
        eel.cancel_auto_ping()();
    } catch (error) {
        console.error('Cancel ping error:', error);
    }
}

// Show/hide progress modal
function showPingProgress(show) {
    let progressEl = document.getElementById('pingProgress');
    if (progressEl) {
        progressEl.style.display = show ? 'block' : 'none';
        progressEl.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
}

// Update progress status
function updatePingStatus(message, current, total) {
    let statusEl = document.getElementById('pingStatus');
    if (statusEl) {
        statusEl.innerText = message;
    }

    if (typeof total === 'number' && total > 0 && typeof current === 'number') {
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
            detailsEl.innerText = 'Completed: ' + current + ' / ' + total;
        }
    }
}

// Utility functions for UI buttons
function copyText(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;

    var text = el.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {
            el.select();
            el.setSelectionRange(0, 99999); /* For mobile devices */
            try { document.execCommand("copy"); } catch (e) { console.error(e); }
        });
    } else {
        el.select();
        el.setSelectionRange(0, 99999); /* For mobile devices */
        try { document.execCommand("copy"); } catch (e) { console.error(e); }
    }
    showBanner();
}

function clearText(elementId) {
    if (confirm('Are you sure you want to clear this text?')) {
        document.getElementById(elementId).value = "";
        if (elementId === 'description') {
            updateIpCountBadge();
        }
    }
}

async function pasteText(elementId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(elementId).value = text;
        if (elementId === 'description') {
            updateIpCountBadge();
        }
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        alert('Failed to read clipboard. Please check permissions or use Ctrl+V.');
    }
}

// Process and display ping results
function processPingResults(results, deviceMapping) {
    updatePingStatus('Processing results...', results.length, results.length);

    if (results.length === 0) {
        document.getElementById('result').value = 'Error: Could not parse ping results.';
        showPingProgress(false);
        setButtonsBusy(false);
        return;
    }

    // Color-coded summary panel (0% loss = Up, anything else = Down)
    let upArr = [];
    let downArr = [];
    results.forEach(function (r) {
        let label = (deviceMapping[r.ip] ? deviceMapping[r.ip] + " - " : "") + r.ip;
        if (r.loss_percent === "0%") {
            upArr.push(label);
        } else {
            downArr.push(label);
        }
    });
    renderResultPanel(upArr, downArr);

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

    // Hide progress and unlock buttons
    setTimeout(function () {
        showPingProgress(false);
        setButtonsBusy(false);
    }, 1000);
}

// ===========================
// THEME SWITCHER
// ===========================

// Supported themes: dark, light, floral
var THEME_BODY_CLASS = {
    dark: null,
    light: 'light-mode',
    floral: 'floral-mode'
};

var ALL_THEME_CLASSES = [
    'light-mode', 'floral-mode'
];

var THEME_LABELS = {
    dark: 'Night',
    light: 'Light',
    floral: 'JC'
};

var THEME_ICONS = {
    dark: 'fa-moon',
    light: 'fa-sun',
    floral: 'fa-seedling'
};

var THEME_ALIASES = {
    india: 'floral',
    liquid: 'dark',
    diwali: 'dark',
    gold: 'dark',
    'indian-gold': 'dark',
    astronomy: 'dark',
    vintage: 'dark',
    hacking: 'dark',
    noc: 'dark',
    modern: 'dark'
};

function setTheme(name) {
    const body = document.body;
    body.classList.remove.apply(body.classList, ALL_THEME_CLASSES);

    if (THEME_ALIASES[name]) {
        name = THEME_ALIASES[name];
    }

    if (!THEME_BODY_CLASS.hasOwnProperty(name)) {
        name = 'dark';
    }

    var cls = THEME_BODY_CLASS[name];
    if (cls) {
        body.classList.add(cls);
    }

    localStorage.setItem('theme', name);
    document.body.dataset.theme = name;
    updateThemeButtons(name);
    resetNotesTheme();
}

function updateThemeButtons(name) {
    document.querySelectorAll('.theme-opt').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.theme === name);
    });
    var label = document.getElementById('themeCurrentLabel');
    if (label) {
        label.textContent = THEME_LABELS[name] || '';
    }
    var icon = document.getElementById('appTitleIcon');
    if (icon) {
        icon.className = 'fas ' + (THEME_ICONS[name] || 'fa-network-wired');
    }
}

// Initialize everything on load (default theme = Dark)
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    setTheme(currentTheme);
    initIpCountWatcher();
    initToolbar();
    initNotes();
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

// Auto-save logic (called once from the main DOMContentLoaded handler)
function initNotes() {
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
}

// Color Switcher Logic
function setNoteColor(bgColor, headerColor) {
    let selection = window.getSelection();
    let noteArea = document.getElementById("quickNotesArea");

    if (selection.rangeCount > 0 && selection.toString().length > 0 && noteArea.contains(selection.anchorNode)) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, headerColor);
    } else {
        let modal = document.getElementById("notesModal");
        let header = modal && modal.querySelector(".notes-modal-header");

        if (modal) {
            modal.style.background = bgColor;
            modal.style.borderColor = headerColor;
        }
        if (header) {
            header.style.background = headerColor;
            header.style.borderBottomColor = headerColor;
        }
    }
}

function resetNotesTheme() {
    var modal = document.getElementById('notesModal');
    if (!modal) return;
    modal.style.background = '';
    modal.style.borderColor = '';
    var header = modal.querySelector('.notes-modal-header');
    if (header) {
        header.style.background = '';
        header.style.borderBottomColor = '';
    }
}

// Clear Notes Logic
function clearNotes() {
    if (confirm("Are you sure you want to clear all notes?")) {
        let area = document.getElementById('quickNotesArea');
        area.innerHTML = "";
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
    var handle = elmnt.querySelector(".notes-modal-header");
    if (handle) {
        handle.onmousedown = dragMouseDown;
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
