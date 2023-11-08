import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import {
    APIInteraction,
    APIInteractionResponse,
    InteractionResponseType,
    InteractionType,
} from 'discord.js';
import { ServerState } from 'src/application/server-manager';
import { GetServerConnection } from 'src/application/use-cases/get-server-connection';
import { StartServer } from 'src/application/use-cases/start-server';
import { StopServer } from 'src/application/use-cases/stop-server';
import { Ec2ServerManager } from 'src/infrastructure/ec2-server-manager';
import { LambdaHandlerAdapter } from 'src/infrastructure/lambda-handler-adapter';
import nacl from 'tweetnacl';

const { AWS_REGION, AWS_EC2_INSTANCE_ID, DISCORD_BOT_PUBLIC_KEY } = process.env;

const logger = new Logger();
const serverManager = new Ec2ServerManager(AWS_REGION, AWS_EC2_INSTANCE_ID);
const getServerConnection = new GetServerConnection(serverManager);
const startServer = new StartServer(logger, serverManager);
const stopServer = new StopServer(logger, serverManager);

export const handler = LambdaHandlerAdapter.create(logger).adaptHttp<
    APIGatewayProxyHandlerV2WithLambdaAuthorizer<unknown>
>(async (event) => {
    try {
        const signature = event.headers['x-signature-ed25519'] ?? '';
        const timestamp = event.headers['x-signature-timestamp'] ?? '';
        const body = event.body ?? '';

        const isValidRequest = nacl.sign.detached.verify(
            Buffer.from(timestamp + body),
            Buffer.from(signature, 'hex'),
            Buffer.from(DISCORD_BOT_PUBLIC_KEY, 'hex'),
        );

        if (!isValidRequest) {
            return {
                statusCode: 401,
                body: `invalid request signature`,
            };
        }
    } catch (error) {
        return {
            statusCode: 401,
            body: `invalid request signature`,
        };
    }

    const interaction = JSON.parse(event.body ?? '{}') as APIInteraction;

    if (interaction.type === InteractionType.Ping) {
        const response: APIInteractionResponse = {
            type: InteractionResponseType.Pong,
        };

        return {
            statusCode: 200,
            body: JSON.stringify(response),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    if (interaction.type !== InteractionType.ApplicationCommand) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
        };
    }

    let response: APIInteractionResponse;
    const command = interaction.data.name;

    logger.info(`Receiver application command: "${command}" (${JSON.stringify(interaction)})`);

    if (command === 'start') {
        const output = await startServer.execute({});

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: output.success
                    ? 'O Servidor está sendo ligado'
                    : 'Não foi possível ligar o servidor, outra operação está sendo realizada',
            },
        };
    } else if (command === 'stop') {
        const output = await stopServer.execute({});

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: output.success
                    ? 'O Servidor está sendo desligado'
                    : 'Não foi possível desligar o servidor, outra operação está sendo realizada',
            },
        };
    } else if (command === 'status') {
        const output = await getServerConnection.execute({});

        const fullHost =
            output.host !== undefined && output.port !== undefined
                ? `${output.host}:${output.port}`
                : undefined;

        const stateToReadableMap: Record<keyof typeof ServerState, string> = {
            PENDING: 'O Servidor está sendo preparado para inicialização',
            RUNNING: 'Servidor ON!',
            SHUTTING_DOWN: 'O servidor está sendo desligado, aguarde...',
            STOPPED: 'O servidor está desligado. Execute o comando `/start` para iniciá-lo',
            STOPPING: 'O servidor está sendo desligado, aguarde...',
            TERMINATED: 'O servidor foi deletado :<, chama o baza',
            UNKNOWN: 'O servidor se encontra em um estado desconhecido, chama o baza',
        };

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content:
                    stateToReadableMap[output.state] +
                    (fullHost !== undefined ? `. O endereço é: \`${fullHost}\`` : ''),
            },
        };
    } else {
        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `Unknown command: ${command}`,
            },
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
    };
});
