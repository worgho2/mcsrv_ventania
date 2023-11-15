import * as sst from 'sst/constructs';
import { Config } from './Config';
import { Server } from './Server';

export const Bot = ({ stack }: sst.StackContext) => {
    const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID, DISCORD_BOT_PUBLIC_KEY } = sst.use(Config);
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
                    permissions: ['ec2:*', 'ssm:*'],
                    environment: {
                        AWS_EC2_INSTANCE_ID: instance.instanceId,
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

    const updateDiscordInteractionsEndpointUrlJob = new sst.Script(
        stack,
        'UpdateDiscordInteractionsEndpointUrlJob',
        {
            onCreate:
                'packages/bot/src/interface/jobs/update-discord-interactions-endpoint-url.handler',
            onUpdate:
                'packages/bot/src/interface/jobs/update-discord-interactions-endpoint-url.handler',
            defaults: {
                function: {
                    environment: {
                        DISCORD_BOT_TOKEN,
                    },
                },
            },
            params: {
                interactionsEndpointUrl: `${discordApi.url}/api/interactions`,
            },
        },
    );

    stack.addOutputs({
        discordInteractionsEndpoint: `${discordApi.url}/api/interactions`,
    });

    return {
        discordApi,
        registerDiscordCommandsJob,
        updateDiscordInteractionsEndpointUrlJob,
    };
};
