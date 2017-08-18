"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SafeShutdown {
    static server(server) {
        let connectionsCount = 0;
        const connections = {};
        server.isShuttingDown = false;
        server.safeShutdown = (timeout) => {
            server.isShuttingDown = true;
            return new Promise((resolve, reject) => {
                let forceClose = false;
                let forceTimeout = null;
                let cleanInterval = null;
                function cleanTimeouts() {
                    if (forceTimeout) {
                        clearTimeout(forceTimeout);
                    }
                    if (cleanInterval) {
                        clearInterval(cleanInterval);
                    }
                }
                try {
                    server.close(() => {
                        cleanTimeouts();
                        resolve();
                    });
                    if (!isNaN(timeout) && +timeout > 0) {
                        forceTimeout = setTimeout(() => {
                            forceClose = true;
                        }, timeout);
                    }
                    cleanInterval = setInterval(() => {
                        const keys = Object.keys(connections).map(i => +i);
                        if (keys.length > 0) {
                            for (const socketId of keys) {
                                if (forceClose || connections[socketId]._isIdle === true) {
                                    connections[socketId].destroy();
                                    delete connections[socketId];
                                }
                            }
                        }
                    }, 250);
                }
                catch (e) {
                    cleanTimeouts();
                    return reject(e);
                }
            });
        };
        server.on('connection', (socket) => {
            connectionsCount += 1;
            const customSocket = socket;
            customSocket._isIdle = true;
            customSocket._socketId = connectionsCount;
            connections[connectionsCount] = customSocket;
            customSocket.on('close', () => {
                delete connections[customSocket._socketId];
            });
        });
        server.on('request', (req, res) => {
            const customSocket = req.socket;
            customSocket._isIdle = false;
            res.on('finish', () => {
                customSocket._isIdle = true;
            });
        });
        return server;
    }
}
exports.SafeShutdown = SafeShutdown;
//# sourceMappingURL=SafeShutdown.js.map