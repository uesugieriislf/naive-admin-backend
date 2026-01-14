import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getAdminInfo(id: number): Promise<{
        code: number;
        message: string;
        result?: undefined;
    } | {
        code: number;
        result: {
            id: number;
            username: string;
            email: string;
            avatar: string;
            permissions: string[];
        };
        message?: undefined;
    }>;
}
