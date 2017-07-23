import { Server } from 'http';
import Timer = NodeJS.Timer;
import { Socket } from 'net';

export interface SafeShutdownServer {
    safeShutdown(timeout?: number): Promise<void>;
}

interface CustomSocket extends Socket {
    _isIdle: boolean;
    _socketId: number;
}

export class SafeShutdown {
    public static server<T extends Server>(server: T): T & SafeShutdownServer {
        // Create connections counter
        let connectionsCount = 0;

        // Create var to store opened connections
        const connections: {[id: number]: CustomSocket} = {};

        // Augment originalServer
        (<any> server).safeShutdown = (timeout?: number) => {
            return new Promise<void>((resolve, reject) => {
                let forceClose = false;
                let forceTimeout: Timer = null;
                let cleanInterval: Timer = null;

                function cleanTimeouts(): void {
                    if (forceTimeout) {
                        clearTimeout(forceTimeout);
                    }
                    if (cleanInterval) {
                        clearInterval(cleanInterval);
                    }
                }

                try {
                    // Stop accepting new connections and wait for all active connections to finish
                    server.close(() => {
                        cleanTimeouts();
                        resolve();
                    });

                    // If a timeout is provided, start to force closing connections after its duration
                    if (!isNaN(timeout) && +timeout > 0) {
                        forceTimeout = setTimeout(() => {
                            forceClose = true;
                        }, timeout);
                    }

                    cleanInterval = setInterval(() => {
                        const keys = Object.keys(connections).map(i => +i);

                        if (keys.length > 0) {
                            for (const socketId of keys) {
                                // TODO: check for timeout and force close if too long
                                if (forceClose || connections[socketId]._isIdle === true) {
                                    connections[socketId].destroy();
                                    delete connections[socketId];
                                }
                            }
                        }
                    }, 250);
                } catch (e) {
                    cleanTimeouts();
                    return reject(e);
                }
            });
        };

        // Add listeners to original server to handle connections
        server.on('connection', (socket) => {
            connectionsCount += 1;
            const customSocket = <CustomSocket> socket;
            customSocket._isIdle = true;
            customSocket._socketId = connectionsCount;
            connections[connectionsCount] = customSocket;

            customSocket.on('close', () => {
                delete connections[customSocket._socketId];
            });
        });

        server.on('request', (req, res) => {
            const customSocket = <CustomSocket> req.socket;
            customSocket._isIdle = false;

            res.on('finish', () => {
                customSocket._isIdle = true;
            });
        });

        return <any> server;
    }
}
