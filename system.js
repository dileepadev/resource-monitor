import GLib from 'gi://GLib';

export class SystemMonitor {
    constructor() {
        this._prevCpu = { total: 0, idle: 0 };
        this._prevNet = { recv: 0, sent: 0, time: 0 };
    }

    getCPUUsage() {
        try {
            const [success, content] = GLib.file_get_contents('/proc/stat');
            if (!success) return null;
            
            const lines = new TextDecoder().decode(content).split('\n');
            const cpuLine = lines[0];
            const parts = cpuLine.trim().split(/\s+/);
            
            const user = parseInt(parts[1]);
            const nice = parseInt(parts[2]);
            const system = parseInt(parts[3]);
            const idle = parseInt(parts[4]);
            const iowait = parseInt(parts[5]);
            const irq = parseInt(parts[6]);
            const softirq = parseInt(parts[7]);
            
            let currentTotal = user + nice + system + idle + iowait + irq + softirq;
            for (let i = 8; i < parts.length; i++) {
                currentTotal += parseInt(parts[i]);
            }

            const currentIdle = idle + iowait; 
            
            const diffTotal = currentTotal - this._prevCpu.total;
            const diffIdle = currentIdle - this._prevCpu.idle;
            
            this._prevCpu = { total: currentTotal, idle: currentIdle };
            
            if (diffTotal === 0) return 0;
            
            const usage = 100 * (1 - (diffIdle / diffTotal));
            return Math.max(0, Math.min(100, usage));
            
        } catch (e) {
            console.error('TopBarResourceMonitor: Error reading CPU usage', e);
            return null;
        }
    }

    getRAMUsage() {
        try {
            const [success, content] = GLib.file_get_contents('/proc/meminfo');
            if (!success) return null;
            
            const text = new TextDecoder().decode(content);
            const totalMatch = text.match(/MemTotal:\s+(\d+)\s+kB/);
            const availableMatch = text.match(/MemAvailable:\s+(\d+)\s+kB/);
            
            if (totalMatch && availableMatch) {
                const total = parseInt(totalMatch[1]);
                const available = parseInt(availableMatch[1]);
                return 100 * ((total - available) / total);
            }
            return null;
        } catch (e) {
            console.error('TopBarResourceMonitor: Error reading RAM usage', e);
            return null;
        }
    }

    getNetworkUsage() {
        try {
            const [success, content] = GLib.file_get_contents('/proc/net/dev');
            if (!success) return null;

            const lines = new TextDecoder().decode(content).split('\n');
            let totalRecv = 0;
            let totalSent = 0;
            const currentTime = GLib.get_monotonic_time() / 1000000; // seconds

            // Skip first 2 headers
            for (let i = 2; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;
                
                const parts = line.split(/\s+/);
                
                let stats = parts;
                if (parts[0].endsWith(':')) {
                    stats = parts.slice(1);
                } else if (parts[0].includes(':')) {
                    const split = parts[0].split(':');
                    stats = [split[1], ...parts.slice(1)];
                }

                if (stats.length >= 9) {
                    if (lines[i].includes('lo:')) continue;

                    const recv = parseInt(stats[0]);
                    const sent = parseInt(stats[8]);
                    if (!isNaN(recv)) totalRecv += recv;
                    if (!isNaN(sent)) totalSent += sent;
                }
            }

            let recvRate = 0;
            let sentRate = 0;

            if (this._prevNet.time > 0) {
                const timeDiff = currentTime - this._prevNet.time;
                if (timeDiff > 0) {
                     if (totalRecv >= this._prevNet.recv) {
                        recvRate = (totalRecv - this._prevNet.recv) / timeDiff;
                     }
                     if (totalSent >= this._prevNet.sent) {
                        sentRate = (totalSent - this._prevNet.sent) / timeDiff;
                     }
                }
            }

            this._prevNet = { recv: totalRecv, sent: totalSent, time: currentTime };
            return { recvRate, sentRate };

        } catch (e) {
            console.error('TopBarResourceMonitor: Error reading network usage', e);
            return null;
        }
    }
}
