# Resource Monitor

Shows the real‑time usage in the GNOME top bar like CPU, RAM, network (download/upload), etc.

## Screenshots

![Resource Monitor Screenshot](https://dileepadev.github.io/images/resource-monitor/preview.png)

## Metadata

```json
{
  "name": "Resource Monitor",
  "description": "Shows the real-time usage in the GNOME top bar like CPU, RAM, network (download/upload), etc.",
  "uuid": "resource-monitor@dileepa.dev",
  "shell-version": [
    "46"
  ],
  "version": 1,
  "url": "https://github.com/dileepadev/resource-monitor"
}
```

## Installation

### Manual Installation

1. **Clone the repository** directly into your local extensions directory:

   ```bash
   git clone https://github.com/dileepadev/resource-monitor.git \ 
   ~/.local/share/gnome-shell/extensions/resource-monitor@dileepa.dev
   ```

2. **Restart GNOME Shell** in order to reload the extensions:
   - **X11**: Press `Alt` + `F2`, type `r`, then press `Enter`.
   - **Wayland**: Log out and log back in.

3. **Enable the extension**:

   ```bash
   gnome-extensions enable resource-monitor@dileepa.dev
   ```

## Credits

- Icons: <https://gitlab.gnome.org/World/design/icon-library>

>[!NOTE]
> Read [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for development guidelines.
