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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth0Service = void 0;
const common_1 = require("@nestjs/common");
const auth0_1 = require("auth0");
const config_1 = require("@nestjs/config");
let Auth0Service = class Auth0Service {
    configService;
    auth0;
    constructor(configService) {
        this.configService = configService;
        this.auth0 = new auth0_1.ManagementClient({
            domain: 'thebigmou.us.auth0.com',
            clientId: 'HzboByDK0egBiGaIhwzfTz3GWOEZeVdO ',
            clientSecret: 'FYVzGlYg5uOz_zv75g5ASQHV6_sECSkPPX4lIiaJhlp2NtgL6tRA8vaJNXSu4HgI',
            audience: 'https://thebigmou.us.auth0.com/api/v2/',
        });
    }
    getManagementClient() {
        return this.auth0;
    }
    async createAuth0User(email, password, name) {
        return this.auth0.users.create({
            connection: 'Username-Password-Authentication',
            email,
            password,
            name,
            email_verified: false,
            verify_email: true,
        });
    }
};
exports.Auth0Service = Auth0Service;
exports.Auth0Service = Auth0Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Auth0Service);
//# sourceMappingURL=auth0.service.js.map