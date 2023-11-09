import {
    DescribeInstanceStatusCommand,
    DescribeInstancesCommand,
    EC2Client,
    StartInstancesCommand,
    StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import { SSMClient, SendCommandCommand } from '@aws-sdk/client-ssm';
import createHttpError from 'http-errors';
import { ServerConnection, ServerManager, ServerState } from 'src/application/server-manager';

export class Ec2ServerManager implements ServerManager {
    private ec2Client: EC2Client;
    private ssmClient: SSMClient;

    constructor(
        AWS_REGION: string,
        private readonly AWS_EC2_INSTANCE_ID: string,
    ) {
        this.ec2Client = new EC2Client({ region: AWS_REGION });
        this.ssmClient = new SSMClient({ region: AWS_REGION });
    }

    private mapInstanceState = (stateName?: string): ServerState => {
        const stateMap: Record<string, keyof typeof ServerState> = {
            pending: ServerState.PENDING,
            running: ServerState.RUNNING,
            'shutting-down': ServerState.SHUTTING_DOWN,
            stopped: ServerState.STOPPED,
            stopping: ServerState.STOPPING,
            terminated: ServerState.TERMINATED,
        };

        const state = stateMap[stateName?.toLowerCase() ?? ''];

        if (state === undefined) {
            throw new createHttpError.InternalServerError('Instance state not found');
        }

        return ServerState[state];
    };

    async getInstanceState(): Promise<ServerState> {
        try {
            const { InstanceStatuses } = await this.ec2Client.send(
                new DescribeInstanceStatusCommand({
                    IncludeAllInstances: true,
                    InstanceIds: [this.AWS_EC2_INSTANCE_ID],
                }),
            );

            const state = this.mapInstanceState(InstanceStatuses?.[0]?.InstanceState?.Name);
            return state;
        } catch (error) {
            return ServerState.UNKNOWN;
        }
    }

    async start(): Promise<ServerState> {
        const currentState = await this.getInstanceState();

        if (currentState !== ServerState.STOPPED) {
            throw new createHttpError.BadRequest(
                `Server cannnot be started. State is ${currentState}`,
            );
        }

        const { StartingInstances } = await this.ec2Client.send(
            new StartInstancesCommand({ InstanceIds: [this.AWS_EC2_INSTANCE_ID] }),
        );

        const state = this.mapInstanceState(StartingInstances?.[0]?.CurrentState?.Name);
        return state;
    }

    async stop(): Promise<ServerState> {
        const currentState = await this.getInstanceState();

        if (currentState !== ServerState.RUNNING) {
            throw new createHttpError.BadRequest(
                `Server cannnot be stopped. State is ${currentState}`,
            );
        }

        const { StoppingInstances } = await this.ec2Client.send(
            new StopInstancesCommand({ InstanceIds: [this.AWS_EC2_INSTANCE_ID] }),
        );

        const state = this.mapInstanceState(StoppingInstances?.[0]?.CurrentState?.Name);
        return state;
    }

    async getConnection(): Promise<ServerConnection> {
        const currentState = await this.getInstanceState();

        if (currentState !== ServerState.RUNNING) {
            return { state: currentState };
        }

        const { Reservations } = await this.ec2Client.send(
            new DescribeInstancesCommand({ InstanceIds: [this.AWS_EC2_INSTANCE_ID] }),
        );

        const ip = Reservations?.[0]?.Instances?.[0]?.PublicIpAddress;

        return {
            address: ip !== undefined ? `${ip}:25565` : undefined,
            state: currentState,
        };
    }

    async sendCommand(command: string): Promise<string[]> {
        await this.ssmClient.send(
            new SendCommandCommand({
                InstanceIds: [this.AWS_EC2_INSTANCE_ID],
                DocumentName: 'AWS-RunShellScript',
                Parameters: {
                    commands: [`echo "${command}" > /home/ec2-user/mcsrv.fifo`],
                },
            }),
        );

        return ['ok'];
    }

    async getLogs(): Promise<string[]> {
        return ['not implemented'];
    }
}
