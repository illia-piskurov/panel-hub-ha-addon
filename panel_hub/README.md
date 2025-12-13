# Lovelace Access Control

A high-performance Home Assistant Add-on built with [Bun](https://bun.sh) to easily manage user access permissions for Lovelace Dashboards and Views.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Arch](https://img.shields.io/badge/arch-aarch64%20|%20amd64-green)

## 📋 Description

Managing dashboard visibility in Home Assistant often requires editing YAML files and manually adding `visible` blocks for specific user IDs. **Lovelace Access Control** provides a clean, visual interface to manage these permissions on the fly.

**Key Features:**
* **Visual Management:** Toggle views between "Public" (visible to everyone) and "Private" (restricted).
* **User Assignment:** Easily select which users have access to specific views via checkboxes.
* **Real-time Updates:** Uses Server-Sent Events (SSE) to update the interface instantly across all open windows when configuration changes.
* **Native Integration:** Uses the official Home Assistant WebSocket API to save configurations safely.
* **Blazing Fast:** Built on the Bun runtime for minimal resource usage and high performance.

## 🚀 Installation

1.  Navigate to your Home Assistant instance.
2.  Go to **Settings** > **Add-ons** > **Add-on Store**.
3.  Click the **three dots** (top right) > **Repositories**.
4.  Add the URL of this GitHub repository.
5.  Scroll down (or refresh) to find **Lovelace Access Control**.
6.  Click **Install** and then **Start**.
7.  Click **Open Web UI** to manage your dashboards.

## ⚙️ Configuration

The add-on works out-of-the-box for permission management. However, to ensure the "Open ↗" links in the interface point to the correct address of your Home Assistant instance, you should configure the `ha_url`.

### Option: `ha_url`

* **Description:** The external or local URL of your Home Assistant instance. This is used solely for generating clickable links in the Add-on UI.
* **Default:** `http://homeassistant.local:8123`
* **Type:** `string`

#### Example Configuration:

```yaml
ha_url: "[http://192.168.1.100:8123](http://192.168.1.100:8123)"
# OR for https
ha_url: "[https://my-ha.duckdns.org](https://my-ha.duckdns.org)"
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

## 📄 License

MIT

---

### Important: Update your `config.yaml`

To make the configuration option (`ha_url`) visible and editable in the Home Assistant Add-on "Configuration" tab, you must update the `config.yaml` file in your project folder to include the `options` and `schema` blocks:

```yaml
name: "Lovelace Manager"
version: "1.0.0"
slug: "lovelace_manager"
description: "Manage dashboard access"
url: "[https://github.com/your-username/my-ha-addons](https://github.com/your-username/my-ha-addons)"
arch:
  - aarch64
  - amd64
startup: application
boot: auto
init: false

ports:
  8000/tcp: 8000

hassio_api: true
homeassistant_api: true

map:
  - config:rw

# --- ADD THIS BLOCK ---
options:
  ha_url: "[http://homeassistant.local:8123](http://homeassistant.local:8123)"
schema:
  ha_url: str
# ----------------------
```