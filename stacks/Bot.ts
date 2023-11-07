import * as sst from 'sst/constructs';
import { Config } from './Config';
import { Server } from './Server';

export const Bot = ({ stack }: sst.StackContext) => {
    const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID, DISCORD_BOT_PUBLIC_KEY, SERVER_PORT } =
        sst.use(Config);
    const { instance } = sst.use(Server);

    const discordApi = new sst.Api(stack, 'BotDiscordApi', {
        cors: true,
        accessLog: {
            retention: 'one_week',
        },
        defaults: {
            authorizer: 'none',
            payloadFormatVersion: '2.0',
        },
        routes: {
            'POST /api/interactions': {
                function: {
                    handler: 'packages/bot/src/interface/api/interactions.handler',
                    permissions: ['ec2:*'],
                    environment: {
                        AWS_EC2_INSTANCE_ID: instance.instanceId,
                        AWS_EC2_INSTANCE_PORT: `${SERVER_PORT}`,
                        DISCORD_BOT_PUBLIC_KEY,
                    },
                },
            },
        },
    });

    const registerDiscordCommandsJob = new sst.Script(stack, 'RegisterDiscordCommandsJob', {
        onCreate: 'packages/bot/src/interface/jobs/register-discord-commands.handler',
        onUpdate: 'packages/bot/src/interface/jobs/register-discord-commands.handler',
        defaults: {
            function: {
                environment: {
                    DISCORD_BOT_TOKEN,
                    DISCORD_BOT_CLIENT_ID,
                },
            },
        },
    });

    stack.addOutputs({
        discordInteractionsEndpoint: `${discordApi.url}/api/interactions`,
    });
};
