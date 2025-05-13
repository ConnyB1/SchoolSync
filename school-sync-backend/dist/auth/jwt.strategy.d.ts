import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
interface Auth0Payload {
    iss: string;
    sub: string;
    aud: string[] | string;
    iat: number;
    exp: number;
    azp: string;
    scope: string;
    permissions?: string[];
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: any;
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersService;
    private readonly logger;
    private readonly rolesNamespace;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: Auth0Payload): Promise<any>;
}
export {};
