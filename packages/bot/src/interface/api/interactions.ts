import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import {
    APIApplicationCommandInteraction,
    APIInteraction,
    APIInteractionResponse,
    Interaction,
    InteractionResponseType,
    InteractionType,
} from 'discord.js';
import { GetServerConnection } from 'src/application/use-cases/get-server-connection';
import { StartServer } from 'src/application/use-cases/start-server';
import { StopServer } from 'src/application/use-cases/stop-server';
import { Ec2ServerManager } from 'src/infrastructure/ec2-server-manager';
import { LambdaHandlerAdapter } from 'src/infrastructure/lambda-handler-adapter';

const { AWS_REGION, AWS_EC2_INSTANCE_ID, AWS_EC2_INSTANCE_PORT } = process.env;

const logger = new Logger();
const serverManager = new Ec2ServerManager(AWS_REGION, AWS_EC2_INSTANCE_ID, AWS_EC2_INSTANCE_PORT);
const getServerConnection = new GetServerConnection(serverManager);
const startServer = new StartServer(logger, serverManager);
const stopServer = new StopServer(logger, serverManager);

export const handler = LambdaHandlerAdapter.create(logger).adaptHttp<
    APIGatewayProxyHandlerV2WithLambdaAuthorizer<unknown>
>(async (event) => {
    const interaction = JSON.parse(event.body ?? '{}') as APIInteraction;
    let response: APIInteractionResponse;

    if (interaction.type !== InteractionType.ApplicationCommand) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
        };
    }

    const command = interaction.data.name;

    logger.info(`Receiver application command: "${command}" (${JSON.stringify(interaction)})`);

    if (command === 'start') {
        const output = await startServer.execute({});

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: output.success ? 'Server is starting' : 'Cannot start server',
            },
        };
    } else if (command === 'stop') {
        const output = await stopServer.execute({});

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: output.success ? 'Server is stopping' : 'Cannot stop server',
            },
        };
    } else if (command === 'status') {
        const output = await getServerConnection.execute({});

        const fullHost =
            output.host !== undefined && output.port !== undefined
                ? `${output.host}:${output.port}`
                : undefined;

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content:
                    `Server state is ${output.state}` + fullHost !== undefined
                        ? `. Server address is \`${fullHost}\``
                        : '. Server address is not available',
            },
        };
    } else {
        response = {
            type: InteractionResponseType.Pong,
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
    };
});
1;
