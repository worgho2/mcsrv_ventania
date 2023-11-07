import { ServerConnection, ServerManager } from '../server-manager';

export interface GetServerConnectionInput {}

export type GetServerConnectionOutput = ServerConnection;

export class GetServerConnection {
    constructor(private readonly serverManager: ServerManager) {}

    async execute(input: GetServerConnectionInput): Promise<GetServerConnectionOutput> {
        const serverConnection = await this.serverManager.getConnection();
        return serverConnection;
    }
}
