import { connectedClients, HA_WS_URL, SUPERVISOR_TOKEN } from "./config";

const notifyClients = () => {
    connectedClients.forEach((controller) => {
        try {
            controller.enqueue("data: update\n\n");
        } catch (e) {
            connectedClients.delete(controller);
        }
    });
};

export const startHAListener = async () => {
    const connect = () => {
        console.log(`🔌 Connecting to HA Event Bus...`);
        const socket = new WebSocket(HA_WS_URL);
        let messageId = 1;

        socket.onopen = () => {};

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());

            if (data.type === "auth_required") {
                socket.send(
                    JSON.stringify({
                        type: "auth",
                        access_token: SUPERVISOR_TOKEN,
                    }),
                );
            }

            if (data.type === "auth_ok") {
                console.log("✅ HA Listener Authenticated.");
                socket.send(
                    JSON.stringify({
                        id: messageId++,
                        type: "subscribe_events",
                        event_type: "lovelace_updated",
                    }),
                );
            }

            if (
                data.type === "event" &&
                data.event &&
                data.event.event_type === "lovelace_updated"
            ) {
                console.log("📢 Event: Lovelace Updated.");
                notifyClients();
            }
        };

        socket.onclose = () => {
            setTimeout(connect, 5000);
        };

        socket.onerror = (e) => {
            console.error("❌ HA Listener Error:", e);
        };
    };

    connect();
};

export const saveConfigViaWS = async (
    urlPath: string,
    config: any,
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(HA_WS_URL);
        const messageId = 1;
        let authenticated = false;

        socket.onopen = () => {};

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());

            if (data.type === "auth_required") {
                socket.send(
                    JSON.stringify({
                        type: "auth",
                        access_token: SUPERVISOR_TOKEN,
                    }),
                );
            }

            if (data.type === "auth_ok") {
                authenticated = true;
                const targetUrlPath = urlPath === "lovelace" ? null : urlPath;
                socket.send(
                    JSON.stringify({
                        id: messageId,
                        type: "lovelace/config/save",
                        url_path: targetUrlPath,
                        config: config,
                    }),
                );
            }

            if (data.id === messageId && authenticated) {
                if (data.success) {
                    resolve(true);
                } else {
                    console.error("❌ Save failed:", data.error);
                    resolve(false);
                }
                socket.close();
            }
        };

        socket.onerror = () => resolve(false);

        setTimeout(() => {
            if (socket.readyState !== WebSocket.CLOSED) {
                socket.close();
                resolve(false);
            }
        }, 5000);
    });
};
