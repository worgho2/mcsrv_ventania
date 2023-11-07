export enum ServerState {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
    SHUTTING_DOWN = 'SHUTTING_DOWN',
    TERMINATED = 'TERMINATED',
    UNKNOWN = 'UNKNOWN',
}

export interface ServerConnection {
    port?: string;
    host?: string;
    state: ServerState;
}

export interface ServerManager {
    start(): Promise<ServerState>;
    stop(): Promise<ServerState>;
    getConnection(): Promise<ServerConnection>;
}
