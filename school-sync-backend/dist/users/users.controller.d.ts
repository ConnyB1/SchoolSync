import { UsersService } from './users.service';
import { LinkStudentDto } from './dto/link-student.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    linkStudentToParent(req: any, linkStudentDto: LinkStudentDto): Promise<{
        message: string;
    }>;
}
