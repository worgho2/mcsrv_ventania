import { SSTConfig } from 'sst';
import { Config } from './stacks/Config';
import { Server } from './stacks/Server';
import { Bot } from './stacks/Bot';

export default {
    config(_input) {
        return {
            name: 'mcsrv-ventania',
            region: 'us-east-1',
        };
    },
    stacks(app) {
        app.stack(Config);
        app.stack(Server);
        app.stack(Bot);
    },
} satisfies SSTConfig;
