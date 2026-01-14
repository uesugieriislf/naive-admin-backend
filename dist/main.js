"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user/user.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: 'http://localhost:8002',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    const userService = app.get(user_service_1.UserService);
    await userService.initializeDefaultUser();
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000');
}
bootstrap();
//# sourceMappingURL=main.js.map