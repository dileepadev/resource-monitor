import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { SystemMonitor } from './system.js';

export const ResourceMonitorIndicator = GObject.registerClass(
class ResourceMonitorIndicator extends PanelMenu.Button {
    _init(extensionDir) {
        super._init(0.5, _('Resource Monitor'));
        this._extensionDir = extensionDir;
        this._systemMonitor = new SystemMonitor();

        this._layout = new St.BoxLayout({
             style_class: 'panel-status-menu-box resource-monitor-box',
        });
        
        // Add spacing manually since CSS property might be unsupported
        this._layout.set_style('spacing: 3px;');
        
        // CPU
        this._cpuItem = this._createItem('computer-chip-symbolic', '#ffffff', 50);
        this._layout.add_child(this._cpuItem.box);

        // RAM
        this._ramItem = this._createItem('ssd-symbolic', '#ffffff', 50);
        this._layout.add_child(this._ramItem.box);

        // Network
        this._downItem = this._createItem('arrow4-down-symbolic', '#ffffff', 68);
        this._layout.add_child(this._downItem.box);
        
        this._upItem = this._createItem('arrow4-up-symbolic', '#ffffff', 68);
        this._layout.add_child(this._upItem.box);

        this.add_child(this._layout);

        // Menu items
        const item = new PopupMenu.PopupMenuItem(_('Open System Monitor'));
        item.connect('activate', () => {
            try {
                GLib.spawn_command_line_async('gnome-system-monitor');
            } catch (e) {
                console.error(e);
            }
        });
        this.menu.addMenuItem(item);
        
        // Initial update
        this._update();

        // Start timer (1 second)
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
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

    _createItem(iconName, color, width) {
        let box = new St.BoxLayout({ style_class: 'resource-monitor-item' });
        // Add spacing manually since CSS property might be unsupported
        box.set_style('spacing: 0.5px;');
        
        // Use gicon for custom/file icon support
        let icon = new St.Icon({
            gicon: this._getGIcon(iconName),
            style_class: 'system-status-icon',
            icon_size: 16
        });
        if (color) {
            icon.set_style(`color: ${color};`);
        }
        let label = new St.Label({
            text: '...',
            y_align: Clutter.ActorAlign.CENTER,
            width: width
        });
        
        box.add_child(icon);
        box.add_child(label);
        
        return { box, label };
    }

    _getGIcon(name) {
        if (this._extensionDir) {
            let file = this._extensionDir.get_child('icons').get_child(`${name}.svg`);
            if (file.query_exists(null)) {
                return new Gio.FileIcon({ file: file });
            }
        }
        return new Gio.ThemedIcon({ name: name });
    }

    _update() {
        const cpuUsage = this._systemMonitor.getCPUUsage();
        const ramUsage = this._systemMonitor.getRAMUsage();
        const netUsage = this._systemMonitor.getNetworkUsage();
        
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
        if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(1)} B/s`;
        if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
        return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }
});
