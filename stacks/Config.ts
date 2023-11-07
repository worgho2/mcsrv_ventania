import * as sst from 'sst/constructs';

export const Config = ({ stack }: sst.StackContext) => {
    const REPOSITORY_SSH_ADDRESS = process.env.REPOSITORY_SSH_ADDRESS;
    const REPOSITORY_DEPLOY_KEY = process.env.REPOSITORY_DEPLOY_KEY;
    const SERVER_SSH_KEY_NAME = process.env.SERVER_SSH_KEY_NAME;
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_BOT_CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID;
    const DISCORD_BOT_PUBLIC_KEY = process.env.DISCORD_BOT_PUBLIC_KEY;

    if (
        !REPOSITORY_SSH_ADDRESS ||
        !REPOSITORY_DEPLOY_KEY ||
        !SERVER_SSH_KEY_NAME ||
        !DISCORD_BOT_TOKEN ||
        !DISCORD_BOT_CLIENT_ID ||
        !DISCORD_BOT_PUBLIC_KEY
    ) {
        throw new Error('Invalid environment config');
    }

    return {
        REPOSITORY_SSH_ADDRESS,
        REPOSITORY_DEPLOY_KEY,
        SERVER_PORT: 25565,
        SERVER_SSH_KEY_NAME,
        DISCORD_BOT_TOKEN,
        DISCORD_BOT_CLIENT_ID,
        DISCORD_BOT_PUBLIC_KEY,
    };
};
