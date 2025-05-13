import { AnnouncementsService } from './announcements.service';
import { Announcement } from './announcement.entity';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    findAll(req: any): Promise<Announcement[]>;
}
