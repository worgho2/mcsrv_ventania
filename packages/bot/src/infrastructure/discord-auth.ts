import { APIInteraction } from 'discord.js';
import { Auth, Role } from 'src/application/auth';
import { Principal } from 'src/domain/dtos/principal';

export class DiscordAuth extends Auth {
    constructor() {
        super({
            ROLE: 'ROLE',
            USER_ID: 'USER_ID',
        });
    }

    static extractPrincipal(interaction: APIInteraction): Principal {
        const { user, member } = interaction;

        const userData = user ?? member?.user;

        /**
         * TODO: Use a service to get the user's roles (maybe bot managed roles)
         */
        const userRoleMap: Record<string, keyof typeof Role> = {
            '426503936501874707': 'OWNER',
            '318259216429219841': 'ADMIN',
            '440774318176206848': 'ADMIN',
        };

        return {
            claims: {
                ROLE: userRoleMap[userData?.id ?? ''] ?? 'NONE',
                USER_ID: userData?.id ?? '',
            },
        };
    }
}
