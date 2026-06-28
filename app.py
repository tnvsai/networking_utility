import warnings
# Suppress pkg_resources deprecation warning
warnings.filterwarnings("ignore", category=UserWarning, module='eel')

import eel
import subprocess
import platform
import re
import os
import ipaddress
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Initialize Eel to serve from current directory
eel.init('.')

# Set absolute path for notes file
NOTES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'quick_notes.txt')

# Allow at most this many concurrent pings to avoid resource exhaustion
MAX_PING_WORKERS = 50

# Set by cancel_auto_ping() to stop an in-flight bulk ping
_ping_cancel = threading.Event()
_active_pings = set()
_active_pings_lock = threading.Lock()

# Hostname pattern (letters, digits, dots, hyphens) used when the target isn't a literal IP
_HOSTNAME_RE = re.compile(r'^[A-Za-z0-9.\-]{1,253}$')


def is_valid_target(target):
    """Return True if target is a valid IP address or a plausible hostname.

    This guards subprocess from being handed unexpected input. Both IPs and
    hostnames are allowed so bulk pinging by name still works."""
    if not isinstance(target, str):
        return False
    target = target.strip()
    if not target:
        return False
    try:
        ipaddress.ip_address(target)
        return True
    except ValueError:
        return bool(_HOSTNAME_RE.match(target))


def _ping_error_result(ip_address, count, message):
    return {
        'ip': ip_address,
        'success': False,
        'loss_percent': '100%',
        'sent': count,
        'received': 0,
        'lost': count,
        'full_output': message,
    }


def _kill_active_pings():
    with _active_pings_lock:
        procs = list(_active_pings)
    for proc in procs:
        try:
            if proc.poll() is None:
                proc.kill()
        except Exception:
            pass


def _register_ping_process(proc):
    with _active_pings_lock:
        _active_pings.add(proc)


def _unregister_ping_process(proc):
    with _active_pings_lock:
        _active_pings.discard(proc)


@eel.expose
def ping_ip(ip_address, count=4):
    """Ping a single IP and return full output. Stops immediately if cancelled."""
    system = platform.system().lower()

    if _ping_cancel.is_set():
        return _ping_error_result(ip_address, count, 'Ping cancelled')

    if not is_valid_target(ip_address):
        return _ping_error_result(ip_address, count, f'Invalid target skipped: {ip_address}')

    proc = None
    try:
        if system == 'windows':
            command = ['ping', '-n', str(count), ip_address]
        else:
            command = ['ping', '-c', str(count), ip_address]

        popen_kwargs = {
            'stdout': subprocess.PIPE,
            'stderr': subprocess.PIPE,
            'text': True,
        }
        if system == 'windows':
            popen_kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW

        proc = subprocess.Popen(command, **popen_kwargs)
        _register_ping_process(proc)

        while True:
            if _ping_cancel.is_set():
                proc.kill()
                try:
                    proc.communicate(timeout=1)
                except Exception:
                    pass
                return _ping_error_result(ip_address, count, 'Ping cancelled')

            try:
                output, err = proc.communicate(timeout=0.1)
                break
            except subprocess.TimeoutExpired:
                continue

        output = (output or '') + (err or '')

        if _ping_cancel.is_set():
            return _ping_error_result(ip_address, count, 'Ping cancelled')

        # Parse output for status
        if system == 'windows':
            match = re.search(r'Sent = (\d+), Received = (\d+), Lost = (\d+) \((\d+)% loss\)', output)
            if match:
                sent = int(match.group(1))
                received = int(match.group(2))
                lost = int(match.group(3))
                loss_percent = match.group(4) + '%'
            else:
                sent, received, lost, loss_percent = count, 0, count, '100%'
        else:
            match = re.search(r'(\d+) packets transmitted, (\d+) received, (\d+)% packet loss', output)
            if match:
                sent = int(match.group(1))
                received = int(match.group(2))
                loss_percent = match.group(3) + '%'
                lost = sent - received
            else:
                sent, received, lost, loss_percent = count, 0, count, '100%'

        user_home = os.path.expanduser('~')
        prompt = f"PS {user_home}> ping {ip_address}"
        full_output = f"{prompt}\n\n{output.strip()}"

        return {
            'ip': ip_address,
            'success': True,
            'loss_percent': loss_percent,
            'sent': sent,
            'received': received,
            'lost': lost,
            'full_output': full_output
        }

    except Exception as e:
        return _ping_error_result(ip_address, count, f'Error: {str(e)}')
    finally:
        if proc is not None:
            _unregister_ping_process(proc)


@eel.expose
def cancel_auto_ping():
    """Immediately stop all in-flight ping subprocesses."""
    _ping_cancel.set()
    _kill_active_pings()
    return True


@eel.expose
def ping_multiple_ips(ip_list, count=4, max_workers=10):
    """Ping multiple IPs concurrently. Returns empty results if cancelled."""
    if not isinstance(ip_list, (list, tuple)):
        print("ping_multiple_ips: ip_list must be a list")
        return {'results': [], 'cancelled': False, 'total': 0}

    _ping_cancel.clear()

    max_workers = max(1, min(int(max_workers or 1), MAX_PING_WORKERS))

    print(f"Pinging {len(ip_list)} IPs...")
    results = []
    cancelled = False
    future_to_ip = {}

    executor = ThreadPoolExecutor(max_workers=max_workers)
    try:
        future_to_ip = {executor.submit(ping_ip, ip, count): ip for ip in ip_list}

        for future in as_completed(future_to_ip):
            if _ping_cancel.is_set():
                cancelled = True
                break

            ip = future_to_ip[future]
            try:
                result = future.result()
            except Exception as e:
                print(f"Error: {ip} - {e}")
                if _ping_cancel.is_set():
                    cancelled = True
                    break
                continue

            if _ping_cancel.is_set():
                cancelled = True
                break

            results.append(result)

            progress = len(results)
            print(f"Progress: {progress}/{len(ip_list)} - {ip}")
            eel.update_ping_progress(progress, len(ip_list), ip)

    finally:
        if cancelled or _ping_cancel.is_set():
            cancelled = True
            _kill_active_pings()
            for pending in future_to_ip:
                pending.cancel()
            executor.shutdown(wait=False, cancel_futures=True)
            results = []
        else:
            executor.shutdown(wait=True)

    status = 'Cancelled' if cancelled else 'Complete'
    print(f"{status}! {len(results)}/{len(ip_list)} IPs processed")
    return {'results': results, 'cancelled': cancelled, 'total': len(ip_list)}


@eel.expose
def save_notes(content):
    """Save quick notes to a file"""
    try:
        with open(NOTES_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error saving notes: {e}")
        return False


@eel.expose
def load_notes():
    """Load quick notes from file"""
    try:
        if os.path.exists(NOTES_FILE):
            with open(NOTES_FILE, 'r', encoding='utf-8') as f:
                return f.read()
        return ""
    except Exception as e:
        print(f"Error loading notes: {e}")
        return ""


# Start app
if __name__ == '__main__':
    import socket

    def _port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(('127.0.0.1', port))
                return False
            except OSError:
                return True

    _PORT = 8000
    if _port_in_use(_PORT):
        print(f'ERROR: Port {_PORT} is already in use.')
        print('Close the other Networking Utility window or run:')
        print('  netstat -ano | findstr :8000')
        input('Press Enter to exit...')
        raise SystemExit(1)

    try:
        eel.start('index.html', size=(1400, 900), mode='default', host='localhost', port=_PORT)
    except (SystemExit, KeyboardInterrupt):
        print('\nClosed')
    except Exception as e:
        print(f'Error: {e}')
        try:
            eel.start('index.html', size=(1400, 900), mode=None, host='localhost', port=_PORT)
        except Exception as e2:
            print(f'Failed: {e2}')
            input('Press Enter to exit...')
            raise SystemExit(1)
