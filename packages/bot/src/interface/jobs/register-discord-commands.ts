import { Logger } from '@aws-lambda-powertools/logger';
import { Handler } from 'aws-lambda';
import { LambdaHandlerAdapter } from 'src/infrastructure/lambda-handler-adapter';
import { REST, Routes } from 'discord.js';

const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID } = process.env;
const logger = new Logger();

type HandlerEvent = { params: {} };

export const handler = LambdaHandlerAdapter.create(logger).adapt<Handler<HandlerEvent>>(
    async (event) => {
        logger.info(`Registering Discord commands`);

        try {
            const discordRestClient = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

            const commands: { name: string; description: string }[] = [
                {
                    name: 'start',
                    description: 'Start the server',
                },
                {
                    name: 'stop',
                    description: 'Stop the server',
                },
                {
                    name: 'status',
                    description: `Get the server's status including the IP address and port`,
                },
            ];

            await discordRestClient.put(Routes.applicationCommands(DISCORD_BOT_CLIENT_ID), {
                body: commands,
            });
        } catch (error) {
            logger.error(`Failed to register Discord commands`, { error });
        }
    },
);
