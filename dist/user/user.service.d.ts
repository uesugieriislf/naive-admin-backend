interface User {
    id: number;
    username: string;
    password: string;
    email: string;
    role: string;
    avatar: string;
}
export declare class UserService {
    private users;
    findOne(username: string): Promise<User | undefined>;
    findOneById(id: number): Promise<User | undefined>;
    create(userData: Partial<User>): Promise<User>;
    hashPassword(password: string): string;
    verifyPassword(plainPassword: string, hashedPassword: string): boolean;
    initializeDefaultUser(): Promise<void>;
}
export {};
