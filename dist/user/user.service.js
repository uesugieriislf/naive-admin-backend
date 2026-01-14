"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const CryptoJS = require("crypto-js");
let UserService = class UserService {
    constructor() {
        this.users = [];
    }
    async findOne(username) {
        return this.users.find(user => user.username === username);
    }
    async findOneById(id) {
        return this.users.find(user => user.id === id);
    }
    async create(userData) {
        const hashedPassword = this.hashPassword(userData.password);
        const user = {
            id: this.users.length + 1,
            username: userData.username,
            password: hashedPassword,
            email: userData.email,
            role: userData.role || 'user',
            avatar: userData.avatar || '',
        };
        this.users.push(user);
        return user;
    }
    hashPassword(password) {
        return CryptoJS.SHA256(password).toString();
    }
    verifyPassword(plainPassword, hashedPassword) {
        return this.hashPassword(plainPassword) === hashedPassword;
    }
    async initializeDefaultUser() {
        const existingUser = await this.findOne('admin');
        if (!existingUser) {
            await this.create({
                username: 'admin',
                password: 'admin123',
                email: 'admin@example.com',
                role: 'admin',
                avatar: '',
            });
            console.log('Default admin user created: username=admin, password=admin123');
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user.service.js.map