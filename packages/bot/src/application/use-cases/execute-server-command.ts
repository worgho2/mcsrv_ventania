import { Principal } from 'src/domain/dtos/principal';
import { ServerManager } from '../server-manager';
import { Auth } from '../auth';

export interface ExecuteServerCommandInput {
    principal: Principal;
    command: string;
}

export type ExecuteServerCommandOutput = {
    output: string;
};

export class ExecuteServerCommand {
    constructor(
        private readonly auth: Auth,
        private readonly serverManager: ServerManager,
    ) {}

    async execute(input: ExecuteServerCommandInput): Promise<ExecuteServerCommandOutput> {
        this.auth.assertRoleOrHigher('OWNER', input.principal);
        const outputLines = await this.serverManager.sendCommand(input.command);
        return {
            output: outputLines.join('\n').slice(-1024),
        };
    }
}
