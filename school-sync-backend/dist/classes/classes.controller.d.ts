import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { Class } from './class.entity';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    create(createClassDto: CreateClassDto, req: any): Promise<Class>;
    join(joinClassDto: JoinClassDto, req: any): Promise<Class>;
    findAllForUser(req: any): Promise<Class[]>;
    findOne(id: string, req: any): Promise<Class>;
    importClasses(file: Express.Multer.File, req: any): Promise<{
        created: number;
        updated: number;
        errors: any[];
    }>;
}
