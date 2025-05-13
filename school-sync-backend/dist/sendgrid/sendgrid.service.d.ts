import { ConfigService } from '@nestjs/config';
export declare class SendGridService {
    private configService;
    private readonly logger;
    private verifiedSender;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, text: string, html: string): Promise<void>;
    sendClassInvitationEmail(email: string, className: string, accessCode: string, teacherName: string): Promise<void>;
}
