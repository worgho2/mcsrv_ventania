import * as sst from 'sst/constructs';

export const Config = ({ stack }: sst.StackContext) => {
    const GITHUB_PAT_URL = process.env.GITHUB_PAT_URL;
    const SERVER_SSH_KEY_NAME = process.env.SERVER_SSH_KEY_NAME;
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_BOT_CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID;
    const DISCORD_BOT_PUBLIC_KEY = process.env.DISCORD_BOT_PUBLIC_KEY;

    if (
        !GITHUB_PAT_URL ||
        !SERVER_SSH_KEY_NAME ||
        !DISCORD_BOT_TOKEN ||
        !DISCORD_BOT_CLIENT_ID ||
        !DISCORD_BOT_PUBLIC_KEY
    ) {
        throw new Error(`Invalid environment config`);
    }

    return {
        GITHUB_PAT_URL,
        SERVER_SSH_KEY_NAME,
        DISCORD_BOT_TOKEN,
        DISCORD_BOT_CLIENT_ID,
        DISCORD_BOT_PUBLIC_KEY,
    };
};
