import { AuthService } from './auth.service';
export declare class LoginDto {
    email: string;
    password?: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): any;
}
