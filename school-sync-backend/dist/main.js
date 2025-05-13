"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    app.enableCors({
        origin: 'http://localhost:8080',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    logger.log(`CORS habilitado para origen: http://localhost:8080'}`);
    app.setGlobalPrefix('api');
    logger.log('Prefijo global de API establecido en "/api"');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    logger.log('Global ValidationPipe habilitado');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`La aplicación está corriendo en: ${await app.getUrl()}`);
    console.log(`Escuchando en el puerto ${port}`);
    console.log(`CORS habilitado para origen: http://localhost:8080`);
    console.log(`Prefijo global de API establecido en "/api"`);
}
bootstrap();
//# sourceMappingURL=main.js.map