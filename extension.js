/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const ResourceMonitorIndicator = GObject.registerClass(
class ResourceMonitorIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Resource Monitor'));

        this._layout = new St.BoxLayout({
             style_class: 'panel-status-menu-box resource-monitor-box',
        });
        
        // Add spacing manually since CSS property might be unsupported
        this._layout.set_style('spacing: 3px;');
        
        // CPU
        this._cpuItem = this._createItem('utilities-system-monitor-symbolic');
        this._layout.add_child(this._cpuItem.box);

        // RAM
        this._ramItem = this._createItem('drive-harddisk-solidstate-symbolic');
        this._layout.add_child(this._ramItem.box);

        // Network
        this._downItem = this._createItem('go-down-symbolic');
        this._layout.add_child(this._downItem.box);
        
        this._upItem = this._createItem('go-up-symbolic');
        this._layout.add_child(this._upItem.box);

        this.add_child(this._layout);

        // Initialize previous stats
        this._prevCpu = { total: 0, idle: 0 };
        this._prevNet = { recv: 0, sent: 0, time: 0 };
        
        // Initial update
        this._update();

        // Start timer (2 seconds)
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
             this._update();
             return GLib.SOURCE_CONTINUE;
        });

        this.connect('destroy', () => {
            if (this._timeoutId) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = null;
            }
        });
    }

    _createItem(iconName) {
        let box = new St.BoxLayout({ style_class: 'resource-monitor-item' });
        // Add spacing manually since CSS property might be unsupported
        box.set_style('spacing: 1px;');
        
        let icon = new St.Icon({
            icon_name: iconName,
            style_class: 'system-status-icon'
        });
        let label = new St.Label({
            text: '...',
            y_align: Clutter.ActorAlign.CENTER
        });
        
        box.add_child(icon);
        box.add_child(label);
        
        return { box, label };
    }

    _update() {
        const cpuUsage = this._getCPUUsage();
        const ramUsage = this._getRAMUsage();
        const netUsage = this._getNetworkUsage();
        
        if (cpuUsage !== null) {
            this._cpuItem.label.set_text(`${cpuUsage.toFixed(1)}%`);
        }
        
        if (ramUsage !== null) {
            this._ramItem.label.set_text(`${ramUsage.toFixed(1)}%`);
        }
        
        if (netUsage !== null) {
            this._downItem.label.set_text(this._formatSpeed(netUsage.recvRate));
            this._upItem.label.set_text(this._formatSpeed(netUsage.sentRate));
        }
    }

    _formatSpeed(bytesPerSec) {
        if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
        return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }

    _getCPUUsage() {
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

    _getRAMUsage() {
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

    _getNetworkUsage() {
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
                // interface name is parts[0] (may contain :)
                // If parts[0] ends with ':', next is bytes. If it's sticky 'eth0:123', split.
                
                let stats = parts;
                if (parts[0].endsWith(':')) {
                    // "eth0: 123 ..." -> parts[0]="eth0:", parts[1]="123"
                    // remove parts[0]
                    stats = parts.slice(1);
                } else if (parts[0].includes(':')) {
                    // "eth0:123 ..."
                    const split = parts[0].split(':');
                    // split[1] is the first number
                    stats = [split[1], ...parts.slice(1)];
                }

                // Now stats[0] is recv bytes, stats[8] is sent bytes
                if (stats.length >= 9) {
                    // Skip loopback? Typically yes.
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
                     // Handle wrap around? Not likely in 2 seconds unless int overflow on 32bit? 
                     // JS numbers are doubles, reading from text means large ints. 
                     // However, if parsing strictly, it's fine. 
                     // But /proc/net/dev counters can reset. 
                     // Assuming monotonic increase for simplicity.
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
});

export default class ResourceMonitorExtension extends Extension {
    enable() {
        this._indicator = new ResourceMonitorIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
