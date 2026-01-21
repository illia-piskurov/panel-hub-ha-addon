# Changelog

## 1.1.2

### Support run without Addon 

> Try like this
```sh
docker run -d \
  -e HA_TOKEN="your_token_here" \
  -e HA_WS_URL="ws://192.168.1.X:8123/api/websocket" \
  -v /path/to/your/ha/config:/homeassistant \
  -p 8000:8000 \
  panel-hub
```

## 1.1.2

### Support Dark/Light System Theme

## 1.1.0

### Major Tech Stack Update
- **Backend**: Migrated from vanilla Bun to **Hono** framework for better routing and reliability.
- **Frontend**: Transitioned to **Svelte** components to improve UI structure and maintainability.

### Key Improvements
- **Hardware Compatibility**: Optimized Docker build to support CPUs without AVX (fixing SIGILL crashes).
- **UI/UX**: Added smooth slide transitions and a responsive grid for user access management.
- **Codebase**: Refactored the interface into reusable components (Cards, Switches, Tabs) for easier development.