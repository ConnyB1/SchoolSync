import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
export declare class ClassesService {
    private classesRepository;
    private usersRepository;
    private usersService;
    private sendgridService;
    private readonly logger;
    constructor(classesRepository: Repository<Class>, usersRepository: Repository<User>, usersService: UsersService, sendgridService: SendGridService);
    private generateAccessCode;
    create(createClassDto: CreateClassDto, teacherAuth0Id: string): Promise<Class>;
    joinClass(joinClassDto: JoinClassDto, studentAuth0Id: string): Promise<Class>;
    findAllForUser(userAuth0Id: string): Promise<Class[]>;
    findById(id: string, userAuth0Id: string): Promise<Class>;
    importClassesFromExcel(fileBuffer: Buffer, currentUserAuth0Id: string): Promise<{
        created: number;
        updated: number;
        errors: any[];
    }>;
}
