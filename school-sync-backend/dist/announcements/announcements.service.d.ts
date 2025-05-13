import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
export declare class AnnouncementsService {
    private announcementsRepository;
    constructor(announcementsRepository: Repository<Announcement>);
    findAll(): Promise<Announcement[]>;
}
