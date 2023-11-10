import { Logger } from '@aws-lambda-powertools/logger';
import { EmbedBuilder } from '@discordjs/builders';
import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import {
    APIEmbed,
    APIInteraction,
    APIInteractionResponse,
    InteractionResponseType,
    InteractionType,
    MessageFlags,
} from 'discord.js';
import { ServerState } from 'src/application/server-manager';
import { ExecuteServerCommand } from 'src/application/use-cases/execute-server-command';
import { GetServerStatus } from 'src/application/use-cases/get-server-status';
import { StartServer } from 'src/application/use-cases/start-server';
import { StopServer } from 'src/application/use-cases/stop-server';
import { DiscordAuth } from 'src/infrastructure/discord-auth';
import { Ec2ServerManager } from 'src/infrastructure/ec2-server-manager';
import { LambdaHandlerAdapter } from 'src/infrastructure/lambda-handler-adapter';
import nacl from 'tweetnacl';

const { AWS_REGION, AWS_EC2_INSTANCE_ID, DISCORD_BOT_PUBLIC_KEY } = process.env;

const logger = new Logger();
const auth = new DiscordAuth();
const serverManager = new Ec2ServerManager(AWS_REGION, AWS_EC2_INSTANCE_ID);

const getServerStatus = new GetServerStatus(serverManager);
const startServer = new StartServer(logger, serverManager);
const stopServer = new StopServer(logger, serverManager);
const executeServerCommand = new ExecuteServerCommand(auth, serverManager);

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

    logger.info(`Received application command: "${command}" (${JSON.stringify(interaction)})`);

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
        const { connection, applicationStatus } = await getServerStatus.execute({});

        const embed = new EmbedBuilder().setTitle('Status do Servidor');

        if (connection.state === ServerState.RUNNING) {
            embed.setColor([0, 255, 0]);

            if (applicationStatus?.online) {
                embed.setDescription('Servidor ON!');
            } else {
                embed.setDescription('Aguardando aplicação iniciar...');
            }

            if (connection.address) {
                embed.addFields([{ name: 'IP', value: `> \`${connection.address}\`` }]);
            }

            if (applicationStatus?.iconUrl) {
                embed.setThumbnail(applicationStatus.iconUrl);
            }

            if (applicationStatus?.players.list) {
                embed.addFields([
                    {
                        name: 'Jogadores',
                        value: applicationStatus.players.list
                            .map((player) => `> ${player.name}`)
                            .join('\n'),
                    },
                ]);
            }

            if (applicationStatus?.version) {
                embed.setFooter({
                    text: `${applicationStatus.software ?? 'Versão'} ${
                        applicationStatus.version ?? 'desconhecida'
                    }`,
                    iconURL: applicationStatus.iconUrl,
                });
            }
        } else {
            const stateToInfoMap: Record<
                keyof typeof ServerState,
                {
                    description: string;
                    color: [number, number, number];
                }
            > = {
                PENDING: {
                    description: 'O Servidor está sendo preparado para inicialização',
                    color: [255, 255, 0],
                },
                RUNNING: {
                    description: 'Servidor ON!',
                    color: [0, 255, 0],
                },
                SHUTTING_DOWN: {
                    description: 'O servidor está sendo desligado, aguarde...',
                    color: [255, 255, 0],
                },
                STOPPED: {
                    description:
                        'O servidor está desligado. Execute o comando `/start` para iniciá-lo',
                    color: [255, 0, 0],
                },
                STOPPING: {
                    description: 'O servidor está sendo desligado, aguarde...',
                    color: [255, 255, 0],
                },
                TERMINATED: {
                    description: 'O servidor foi deletado :<, chama o baza',
                    color: [255, 0, 0],
                },
                UNKNOWN: {
                    description: 'O servidor se encontra em um estado desconhecido, chama o baza',
                    color: [255, 0, 0],
                },
            };

            const { description, color } = stateToInfoMap[connection.state];
            embed.setDescription(description).setColor(color);
        }

        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                embeds: [embed.toJSON()],
            },
        };
    } else if (command === 'execute') {
        try {
            const castedOptions = interaction as any;
            const commandOption = castedOptions.data.options[0]?.value as string | undefined;

            if (commandOption === undefined) {
                throw new Error('Command option not found');
            }

            const { output } = await executeServerCommand.execute({
                principal: DiscordAuth.extractPrincipal(interaction),
                command: commandOption,
            });

            response = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `Comando \`${commandOption}\` executado.\n${output}`,
                    flags: MessageFlags.Ephemeral,
                },
            };
        } catch (error) {
            response = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: error instanceof Error ? error.message : 'Erro desconhecido',
                    flags: MessageFlags.Ephemeral,
                },
            };
        }
    } else {
        response = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: `Unknown command: ${command}`,
                flags: MessageFlags.Ephemeral,
            },
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
    };
});
