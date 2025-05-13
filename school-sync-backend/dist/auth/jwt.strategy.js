"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const jwks_rsa_1 = require("jwks-rsa");
const users_service_1 = require("../users/users.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    usersService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    rolesNamespace;
    constructor(configService, usersService) {
        const issuerUrl = configService.get('AUTH0_ISSUER_URL');
        if (!issuerUrl) {
            throw new Error('AUTH0_ISSUER_URL no está configurado en las variables de entorno.');
        }
        super({
            secretOrKeyProvider: (0, jwks_rsa_1.passportJwtSecret)({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${issuerUrl}.well-known/jwks.json`,
            }),
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: configService.get('AUTH0_AUDIENCE'),
            issuer: issuerUrl,
            algorithms: ['RS256'],
        });
        this.configService = configService;
        this.usersService = usersService;
        this.rolesNamespace = 'https://schoolsync.example.com/';
    }
    async validate(payload) {
        this.logger.debug(`Validando payload de JWT: ${JSON.stringify(payload)}`);
        const auth0Id = payload.sub;
        if (!auth0Id) {
            this.logger.warn('Token inválido: sub (Auth0 User ID) no encontrado en el payload.');
            throw new common_1.UnauthorizedException('Token inválido: Identificador de usuario no encontrado.');
        }
        const email = payload.email || payload[`${this.rolesNamespace}email`];
        const name = payload.name || payload[`${this.rolesNamespace}name`];
        const picture = payload.picture || payload[`${this.rolesNamespace}picture`];
        const auth0Roles = payload[`${this.rolesNamespace}roles`] || [];
        try {
            const localUser = await this.usersService.findOrCreateByAuth0Profile({
                auth0Id,
                email: email,
                Nombre: name,
                picture,
                rolesFromAuth0: auth0Roles,
            });
            if (!localUser) {
                this.logger.error(`No se pudo encontrar o crear el usuario local para Auth0 ID: ${auth0Id}`);
                throw new common_1.UnauthorizedException('Usuario no encontrado o no se pudo sincronizar.');
            }
            return {
                userId: localUser.id,
                auth0UserId: localUser.auth0Id,
                email: localUser.email,
                roles: localUser.roles,
                nombre: localUser.Nombre,
                apellido: localUser.Apellido,
                picture: localUser.picture,
            };
        }
        catch (error) {
            this.logger.error(`Error durante la validación del usuario y sincronización: ${error.message}`, error.stack);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error procesando la autenticación del usuario.');
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map