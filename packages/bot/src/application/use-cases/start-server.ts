import { Logger } from '../logger';
import { ServerManager, ServerState } from '../server-manager';

export interface StartServerInput {}

export interface StartServerOutput {
    success: boolean;
}

export class StartServer {
    constructor(
        private readonly logger: Logger,
        private readonly serverManager: ServerManager,
    ) {}

    async execute(input: StartServerInput): Promise<StartServerOutput> {
        try {
            await this.serverManager.start();
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to start server`, { error });
            return { success: false };
        }
    }
}
