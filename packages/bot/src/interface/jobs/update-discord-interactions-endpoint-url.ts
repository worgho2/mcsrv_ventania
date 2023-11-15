import { Logger } from '@aws-lambda-powertools/logger';
import { Handler } from 'aws-lambda';
import { LambdaHandlerAdapter } from 'src/infrastructure/lambda-handler-adapter';
import { REST, Routes } from 'discord.js';

const { DISCORD_BOT_TOKEN } = process.env;
const logger = new Logger();

type HandlerEvent = {
    params: {
        interactionsEndpointUrl: string;
    };
};

export const handler = LambdaHandlerAdapter.create(logger).adapt<Handler<HandlerEvent>>(
    async (event) => {
        logger.info(`Updating Discord interactions endpoint URL`);

        try {
            const discordRestClient = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

            await discordRestClient.patch(Routes.currentApplication(), {
                body: { interactions_endpoint_url: event.params.interactionsEndpointUrl },
            });
        } catch (error) {
            logger.error(`Failed to update Discord interactions endpoint URL`, { error });
        }
    },
);
