import { ManagementClient } from 'auth0';
import { ConfigService } from '@nestjs/config';
export declare class Auth0Service {
    private configService;
    private auth0;
    constructor(configService: ConfigService);
    getManagementClient(): ManagementClient;
    createAuth0User(email: string, password: string, name: string): Promise<any>;
}
