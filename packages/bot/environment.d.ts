/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
    interface ProcessEnv {
        IS_LOCAL?: string;
        AWS_REGION: string;
        AWS_EXECUTION_ENV: string;
        AWS_EC2_INSTANCE_ID: string;
        AWS_EC2_INSTANCE_PORT: string;
        DISCORD_BOT_TOKEN: string;
        DISCORD_BOT_CLIENT_ID: string;
    }
}
