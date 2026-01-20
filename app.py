import warnings
# Suppress pkg_resources deprecation warning
warnings.filterwarnings("ignore", category=UserWarning, module='eel')

import eel
import subprocess
import platform
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# Initialize Eel to serve from current directory
eel.init('.')

@eel.expose
def ping_ip(ip_address, count=4):
    """Ping a single IP and return full output"""
    system = platform.system().lower()
    
    try:
        # Build ping command
        if system == 'windows':
            command = ['ping', '-n', str(count), ip_address]
        else:
            command = ['ping', '-c', str(count), ip_address]
        
        # Execute ping
        kwargs = {'capture_output': True, 'text': True, 'timeout': 60}
        if system == 'windows':
            # Prevent console window from popping up
            kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
            
        result = subprocess.run(command, **kwargs)
        output = result.stdout + result.stderr
        
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
        
        return {
            'ip': ip_address,
            'success': True,
            'loss_percent': loss_percent,
            'sent': sent,
            'received': received,
            'lost': lost,
            'full_output': output.strip()
        }
        
    except subprocess.TimeoutExpired:
        return {
            'ip': ip_address,
            'success': False,
            'loss_percent': '100%',
            'sent': count,
            'received': 0,
            'lost': count,
            'full_output': f'Ping timed out for {ip_address}'
        }
    except Exception as e:
        return {
            'ip': ip_address,
            'success': False,
            'loss_percent': '100%',
            'sent': count,
            'received': 0,
            'lost': count,
            'full_output': f'Error: {str(e)}'
        }


@eel.expose
def ping_multiple_ips(ip_list, count=4, max_workers=10):
    """Ping multiple IPs concurrently"""
    print(f"Pinging {len(ip_list)} IPs...")
    results = []
    
    # Ping IPs concurrently
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_ip = {executor.submit(ping_ip, ip, count): ip for ip in ip_list}
        
        # Collect results
        for future in as_completed(future_to_ip):
            ip = future_to_ip[future]
            try:
                result = future.result()
                results.append(result)
                
                # Update progress
                progress = len(results)
                print(f"Progress: {progress}/{len(ip_list)} - {ip}")
                eel.update_ping_progress(progress, len(ip_list), ip)
                
            except Exception as e:
                print(f"Error: {ip} - {e}")
                results.append({
                    'ip': ip,
                    'success': False,
                    'loss_percent': '100%',
                    'sent': count,
                    'received': 0,
                    'lost': count,
                    'full_output': f'Error: {str(e)}'
                })
    
    print(f"Complete! {len(results)}/{len(ip_list)} IPs processed")
    return results


@eel.expose
def get_system_info():
    """Get system info"""
    return {
        'os': platform.system(),
        'os_version': platform.version(),
        'python_version': platform.python_version()
    }


# Start app
if __name__ == '__main__':
    try:
        eel.start('index.html', size=(1400, 900), mode='default', host='localhost', port=8000)
    except (SystemExit, KeyboardInterrupt):
        print('\nClosed')
    except Exception as e:
        print(f'Error: {e}')
        try:
            eel.start('index.html', size=(1400, 900), mode=None, host='localhost', port=8000)
        except Exception as e2:
            print(f'Failed: {e2}')
