import createHttpError from 'http-errors';
import { Principal } from 'src/domain/dtos/principal';

export enum Role {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    USER = 'USER',
    NONE = 'NONE',
}

export enum AuthClaims {
    USER_ID = 'USER_ID',
    ROLE = 'ROLE',
}

export abstract class Auth {
    private readonly roleOrder: Record<keyof typeof Role, number> = {
        OWNER: 0,
        ADMIN: 1,
        USER: 2,
        NONE: 3,
    };

    constructor(private readonly claimKeys: Record<keyof typeof AuthClaims, string>) {}

    hasRoleOrHigher(role: keyof typeof Role, principal: Principal): boolean {
        const principalRoleString = principal.claims[this.claimKeys.ROLE];

        const principalRole: keyof typeof Role = Object.keys(Role).includes(
            `${String(principalRoleString)}`,
        )
            ? (principalRoleString as keyof typeof Role)
            : 'NONE';

        return this.roleOrder[principalRole] <= this.roleOrder[role];
    }

    assertRoleOrHigher(role: keyof typeof Role, principal: Principal): void {
        if (!this.hasRoleOrHigher(role, principal)) {
            throw new createHttpError.Forbidden(`Você não tem permissão para executar esta ação`);
        }
    }
}
