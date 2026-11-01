# OpenHands Agent Canvas

[start-agent-canvas.sh](start-agent-canvas.sh) runs on every container start and every time VS Code attaches. It starts a supervisor that restarts Agent Canvas if it exits, and serves Agent Canvas on port `8100` on all interfaces in public mode, using Claude Code with your Claude Pro/Max subscription (no API key).

- API key: `~/.openhands/canvas-api-key` (generated once)
- Log: `~/.openhands/agent-canvas.log`
- `~/.claude` (login) and `~/.openhands` (Canvas settings) are kept on Docker volumes, so they survive rebuilds.

## Setup

1. Rebuild the Dev Container.
2. Check the Claude Code login in the container terminal:

   ```sh
   claude auth status   # if not logged in: claude auth login (pick the Claude.ai subscription)
   ```

3. In Agent Canvas, open **Settings → Agent** and set **Preset** to **Claude Code**.
4. Allow incoming connections on Windows (admin PowerShell):

   ```powershell
   New-NetFirewallRule -DisplayName "Agent Canvas" -Direction Inbound -Protocol TCP -LocalPort 8100 -Action Allow -Profile Private
   ```

   If Docker Engine runs inside WSL2 (not Docker Desktop), also add the following to `%UserProfile%\.wslconfig`, then run `wsl --shutdown`:

   ```ini
   [wsl2]
   networkingMode=mirrored
   ```

5. On your phone, open `http://<laptop-LAN-IP>:8100/canvas` (find the IP with `ipconfig` on Windows) and paste the key:

   ```sh
   cat ~/.openhands/canvas-api-key
   ```

## Notes

- Traffic is plain HTTP, so only use this on a trusted network. To reach the laptop from anywhere without opening the port to your whole network, use Tailscale.
- Anyone with the key can run commands in the container, and `/workspace` is your actual project folder on the laptop.
- The laptop must stay awake and the container must keep running.
- Canvas takes about a minute to start (it installs Python packages on first launch), so `:8100` won't respond right away.
- To start Canvas manually, run `bash .devcontainer/scripts/start-agent-canvas.sh`. Running it again while Canvas is up does nothing.
- To restart Canvas, run `pkill -f '^node .*agent-canvas --host'`. The supervisor brings it back within a few seconds.
