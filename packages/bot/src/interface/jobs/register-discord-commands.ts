import { Logger } from '@aws-lambda-powertools/logger';
import { Handler } from 'aws-lambda';
import { LambdaHandlerAdapter } from 'src/infrastructure/lambda-handler-adapter';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID } = process.env;
const logger = new Logger();

type HandlerEvent = { params: {} };

export const handler = LambdaHandlerAdapter.create(logger).adapt<Handler<HandlerEvent>>(
    async (event) => {
        logger.info(`Registering Discord commands`);

        try {
            const discordRestClient = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

            const startCommand = new SlashCommandBuilder()
                .setName('start')
                .setDescription('Start the server')
                .toJSON();

            const stopCommand = new SlashCommandBuilder()
                .setName('stop')
                .setDescription('Stop the server')
                .toJSON();

            const statusCommand = new SlashCommandBuilder()
                .setName('status')
                .setDescription(`Get the server's status including the IP address and port`)
                .toJSON();

            const executeCommand = new SlashCommandBuilder()
                .setName('execute')
                .setDescription(`Execute a command on the server`)
                .addStringOption((option) =>
                    option
                        .setName('command')
                        .setDescription('The command to execute')
                        .setRequired(true),
                )
                .toJSON();

            await discordRestClient.put(Routes.applicationCommands(DISCORD_BOT_CLIENT_ID), {
                body: [startCommand, stopCommand, statusCommand, executeCommand],
            });
        } catch (error) {
            logger.error(`Failed to register Discord commands`, { error });
        }
    },
);
