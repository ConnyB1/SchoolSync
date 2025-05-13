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
var SendGridService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sgMail = require("@sendgrid/mail");
let SendGridService = SendGridService_1 = class SendGridService {
    configService;
    logger = new common_1.Logger(SendGridService_1.name);
    verifiedSender;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('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');
        this.verifiedSender = this.configService.get('SENDGRID_VERIFIED_SENDER') ?? 'schoolsync.real@gmail.com';
        if (!apiKey) {
            this.logger.warn('SENDGRID_API_KEY no está configurada. El servicio de correo no funcionará.');
        }
        else {
            sgMail.setApiKey(apiKey);
            this.logger.log('Servicio SendGrid configurado.');
        }
        if (!this.verifiedSender) {
            this.logger.warn('SENDGRID_VERIFIED_SENDER no está configurado. Se usará un placeholder.');
            this.verifiedSender = 'schoolsync.real@gmail.com';
        }
    }
    async sendEmail(to, subject, text, html) {
        if (!sgMail.setApiKey) {
            this.logger.error('API Key de SendGrid no configurada. No se puede enviar correo.');
            return;
        }
        const msg = {
            to,
            from: this.verifiedSender,
            subject,
            text,
            html,
        };
        try {
            await sgMail.send(msg);
            this.logger.log(`Correo enviado a <span class="math-inline">\{to\} con asunto "</span>{subject}"`);
        }
        catch (error) {
            this.logger.error(`Error enviando correo a ${to}:`, error.response?.body || error.message);
        }
    }
    async sendClassInvitationEmail(email, className, accessCode, teacherName) {
        const subject = `Invitación a la clase: ${className}`;
        const text = `Hola,\n\nHas sido invitado a unirte a la clase "${className}" impartida por ${teacherName}.\nUsa el siguiente código de acceso para unirte: ${accessCode}\n\nGracias,\nEl equipo de SchoolSync`;
        const html = `
      <p>Hola,</p>
      <p>Has sido invitado a unirte a la clase "<strong><span class="math-inline">\{className\}</strong\>" impartida por <strong\></span>{teacherName}</strong>.</p>
      <p>Usa el siguiente código de acceso para unirte: <strong>${accessCode}</strong></p>
      <p>Puedes ingresar a la plataforma y usar el código para unirte a la clase.</p>
      <p>Gracias,<br>El equipo de SchoolSync</p>
    `;
        await this.sendEmail(email, subject, text, html);
    }
};
exports.SendGridService = SendGridService;
exports.SendGridService = SendGridService = SendGridService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SendGridService);
//# sourceMappingURL=sendgrid.service.js.map