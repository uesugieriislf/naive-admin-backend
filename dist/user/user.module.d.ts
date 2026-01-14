import { OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';
export declare class UserModule implements OnModuleInit {
    private userService;
    constructor(userService: UserService);
    onModuleInit(): Promise<void>;
}
