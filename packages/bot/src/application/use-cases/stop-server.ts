import { Logger } from '../logger';
import { ServerManager, ServerState } from '../server-manager';

export interface StopServerInput {}

export interface StopServerOutput {
    success: boolean;
}

export class StopServer {
    constructor(
        private readonly logger: Logger,
        private readonly serverManager: ServerManager,
    ) {}

    async execute(input: StopServerInput): Promise<StopServerOutput> {
        try {
            await this.serverManager.stop();
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to stop server`, { error });
            return { success: false };
        }
    }
}
