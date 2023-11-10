import { ServerManager, ServerStatus } from '../server-manager';

export interface GetServerStatusInput {}

export type GetServerStatusOutput = ServerStatus;

export class GetServerStatus {
    constructor(private readonly serverManager: ServerManager) {}

    async execute(input: GetServerStatusInput): Promise<GetServerStatusOutput> {
        const serverStatus = await this.serverManager.getStatus();
        return serverStatus;
    }
}
