import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import os from "os";

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const hostIP = getLocalIP();

export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        host: '0.0.0.0', // <== Macht Vite im lokalen Netzwerk erreichbar!
        proxy: {
            '/api': `http://${hostIP}:3000/`, // <-- leitet alles mit /api an Express-Backend weiter
        },

    }
});
