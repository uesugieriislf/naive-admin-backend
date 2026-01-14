import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        code: number;
        result: {
            token: string;
            id: any;
            username: any;
            email: any;
            avatar: any;
            permissions: string[];
        };
    }>;
    logout(): Promise<{
        code: number;
        message: string;
    }>;
}
