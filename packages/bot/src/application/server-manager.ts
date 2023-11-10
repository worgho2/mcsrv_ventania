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

export interface ServerApplicationStatus {
    online: boolean;
    ip: string;
    port: number;
    hostname?: string;
    debug?: {
        ping: boolean;
        query: boolean;
        srv: boolean;
        querymismatch: boolean;
        ipinsrv: boolean;
        cnameinsrv: boolean;
        animatedmotd: boolean;
        cachehit: boolean;
        cachetime: number;
        cacheexpire: number;
        apiversion: number;
    };
    version: string;
    protocol?: {
        version: number;
        name?: string;
    };
    icon?: string;
    software?: string;
    map?: {
        raw: string;
        clean: string;
        html: string;
    };
    gamemode?: string;
    serverid?: string;
    eula_blocked?: boolean;
    motd: {
        raw: string[];
        clean: string[];
        html: string[];
    };
    players: {
        online: number;
        max: number;
        list?: {
            name: string;
            uuid: string;
        }[];
    };
    plugins?: {
        name: string;
        version: string;
    }[];
    mods?: {
        name: string;
        version: string;
    }[];
    info?: {
        raw: string[];
        clean: string[];
        html: string[];
    };
    iconUrl: string;
}

export interface ServerStatus {
    connection: ServerConnection;
    applicationStatus?: ServerApplicationStatus;
}

export interface ServerManager {
    start(): Promise<ServerState>;
    stop(): Promise<ServerState>;
    getStatus(): Promise<ServerStatus>;
    sendCommand(command: string): Promise<string[]>;
}
