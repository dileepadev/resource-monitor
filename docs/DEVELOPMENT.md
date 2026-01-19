# GNOME Extension Testing & Development Guide

## Extension ID

```text
top-bar-resource-monitor@dileepa.dev
```

## 0. Installation for Development

Run this from the repository root to install the extension for development (symlink):

```bash
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$PWD" ~/.local/share/gnome-shell/extensions/top-bar-resource-monitor@dileepa.dev
```

## 1. Confirm the Extension Is Installed

List all installed extensions:

```bash
gnome-extensions list
```

Ensure your extension appears in the list.

## 2. Enable / Disable / Uninstall the Extension

Enable:

```bash
gnome-extensions enable top-bar-resource-monitor@dileepa.dev
```

Disable:

```bash
gnome-extensions disable top-bar-resource-monitor@dileepa.dev
```

Uninstall:

```bash
gnome-extensions uninstall top-bar-resource-monitor@dileepa.dev
```

## 3. Confirm Extension State

Check detailed status:

```bash
gnome-extensions info top-bar-resource-monitor@dileepa.dev
```

Expected output:

```text
State: ENABLED
```

If it says `DISABLED` or `ERROR`, check logs.

## 4. Reload GNOME Shell

### X11 (Xorg)

The easiest way to reload the shell:

1. Press `Alt` + `F2`
2. Type `r`
3. Press `Enter`

### Wayland

> ⚠️ `Alt + F2 → r` does NOT work on Wayland

#### Recommended (safe)

Log out and log back in.

#### Alternative (advanced)

```bash
Ctrl + Alt + F3
login
gnome-shell --replace
```

Return to desktop:

```bash
Ctrl + Alt + F2
```

## 5. Verify the Extension Is Running

### Top Bar

If your extension adds an indicator:

* Check the **right side of the top bar**
* Switch themes if the icon is invisible

### Looking Glass (GNOME Debugger)

Open:

```text
Alt + F2 → lg
```

Check:

* **Extensions tab** → your extension status
* **Errors tab** → runtime errors
* **Console tab** → test JavaScript

## 6. Development Logging (Most Important)

### Live GNOME Shell Logs

Run this **before enabling the extension**:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

Then reload the extension:

```bash
gnome-extensions disable top-bar-resource-monitor@dileepa.dev
gnome-extensions enable top-bar-resource-monitor@dileepa.dev
```

## 7. Logging From Extension Code

Use logging in `extension.js`:

```js
log('Top Bar Resource Monitor loaded');
```

Logs will appear in `journalctl`.

## 8. Common Problems

### Extension immediately disables

* Check `metadata.json`:

```json
"shell-version": ["45", "46"]
```

### No UI appears

* Ensure indicator is added to the panel:

```js
Main.panel.addToStatusArea(
  'resource-monitor',
  indicator,
  0,
  'right'
);
```

### JavaScript errors

* Check **Looking Glass → Errors**
* Check `journalctl`

## 9. Fast Development Loop

```bash
# Edit code
nano ~/.local/share/gnome-shell/extensions/top-bar-resource-monitor@dileepa.dev/extension.js

# Reload extension
gnome-extensions disable top-bar-resource-monitor@dileepa.dev
gnome-extensions enable top-bar-resource-monitor@dileepa.dev
```

Keep `journalctl` running while developing.

## 10. Extension Location

User-installed extensions live here:

```bash
~/.local/share/gnome-shell/extensions/
```
