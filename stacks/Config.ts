import * as sst from 'sst/constructs';

export const Config = ({ stack }: sst.StackContext) => {
    return {
        REPOSITORY_SSH_ADDRESS: 'git@github.com:worgho2/mcsrv_ventania.git',
        SERVER_PORT: 25565,
        SERVER_SSH_KEY_NAME: process.env.SERVER_SSH_KEY_NAM!,
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN!,
        DISCORD_BOT_CLIENT_ID: process.env.DISCORD_BOT_CLIENT_ID!,
    };
};
