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
    address?: string;
    state: ServerState;
}

export interface ServerManager {
    start(): Promise<ServerState>;
    stop(): Promise<ServerState>;
    getConnection(): Promise<ServerConnection>;
    sendCommand(command: string): Promise<string[]>;
    getLogs(): Promise<string[]>;
}
