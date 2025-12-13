# Panel Hub

A high-performance Home Assistant Add-on built with [Bun](https://bun.sh) to easily manage user access permissions for Lovelace Dashboards and Views.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Arch](https://img.shields.io/badge/arch-aarch64%20|%20amd64-green)

## 📋 Description

Managing dashboard visibility in Home Assistant often requires editing YAML files and manually adding `visible` blocks for specific user IDs. **Panel Hub** provides a clean, visual interface to manage these permissions on the fly.

**Key Features:**
* **Visual Management:** Toggle views between "Public" (visible to everyone) and "Private" (restricted).
* **User Assignment:** Easily select which users have access to specific views via checkboxes.
* **Real-time Updates:** Uses Server-Sent Events (SSE) to update the interface instantly across all open windows when configuration changes.
* **Native Integration:** Uses the official Home Assistant WebSocket API to save configurations safely.
* **Blazing Fast:** Built on the Bun runtime for minimal resource usage and high performance.
* **Sidebar Integration:** Appears directly in your Home Assistant sidebar for quick access.

## 🚀 Installation

1. Navigate to your Home Assistant instance.
2. Go to **Settings** > **Add-ons** > **Add-on Store**.
3. Click the **three dots** (top right) > **Repositories**.
4. Add the URL of this GitHub repository.
5. Scroll down (or refresh) to find **Panel Hub**.
6. Click **Install** and then **Start**.
7. Enable "**Show in sidebar**" to add Panel Hub to your Home Assistant sidebar.
8. Click **Open Web UI** or use the sidebar icon to manage your dashboards.

## ⚙️ Configuration

The add-on works out-of-the-box for permission management. However, to ensure the "Open ↗" links in the interface point to the correct address of your Home Assistant instance, you should configure the `ha_url`.

### Option: `ha_url`

* **Description:** The external or local URL of your Home Assistant instance. This is used solely for generating clickable links in the Add-on UI.
* **Default:** `http://homeassistant.local:8123`
* **Type:** `string`

#### Example Configuration:
```yaml
ha_url: "http://192.168.1.100:8123"
# OR for https
ha_url: "https://my-ha.duckdns.org"
```

## 🛠 Technical Details

This add-on is a containerized application running:
* **Runtime:** Bun (v1.x)
* **Language:** TypeScript
* **Communication:**
    * **Frontend <-> Add-on:** REST API & EventSource (SSE)
    * **Add-on <-> Home Assistant:** Persistent WebSocket connection (using Supervisor Token)

## ⚠️ Requirements

* **Home Assistant OS** or **Supervised** installation.
* User permissions to install add-ons.
* At least one Lovelace dashboard configured.

## 📄 License

MIT

---

## Complete `config.yaml` Reference

Here's the complete working configuration for this add-on:
```yaml
name: "Panel Hub"
version: "1.0.0"
slug: "panel_hub"
description: "user rights management for Panels"
arch:
  - amd64
  - aarch64
startup: application
boot: auto
panel_icon: mdi:shield-account
panel_title: Panel Hub
ingress: true
ingress_port: 8000
ingress_stream_timeout: 120
hassio_api: true
homeassistant_api: true
map:
  - homeassistant_config:rw
options:
  ha_url: "http://homeassistant.local:8123"
schema:
  ha_url: str
```

### Key Configuration Notes:

- **`ingress: true`** - Uses Home Assistant's built-in proxy (no port exposure needed)
- **`map: homeassistant_config:rw`** - Required for accessing dashboard and user data
- **`panel_icon`** and **`panel_title`** - Adds the add-on to your Home Assistant sidebar
- **No `ports:` section** - Ingress handles routing internally
