# Top‑Bar Resource Monitor

Shows the real‑time usage in the GNOME top bar like CPU, RAM, network (download/upload), etc.

Metadata

```json
{
  "name": "Resource Monitor",
  "description": "Shows the real-time usage in the GNOME top bar like CPU, RAM, network (download/upload), etc.",
  "uuid": "resource-monitor@dileepa.dev",
  "shell-version": [
    "46"
  ]
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

>[!NOTE]
> Read [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for development guidelines.
