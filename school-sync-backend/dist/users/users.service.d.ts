import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Auth0Service } from '../auth/auth0.service';
interface Auth0ProfileData {
    auth0Id: string;
    email: string;
    Nombre?: string;
    Apellido?: string;
    picture?: string;
    rolesFromAuth0?: string[];
}
export declare class UsersService {
    private usersRepository;
    private auth0Service;
    private readonly logger;
    constructor(usersRepository: Repository<User>, auth0Service: Auth0Service);
    findAll(): Promise<User[]>;
    findOneById(id: string): Promise<User | null>;
    findOneByEmail(email: string): Promise<User | null>;
    findOneByAuth0Id(auth0Id: string): Promise<User | null>;
    findOrCreateByAuth0Profile(profileData: Auth0ProfileData): Promise<User>;
    linkParentToStudent(parentAuth0Id: string, studentAuth0Id: string): Promise<void>;
    getLinkedStudentsForParent(parentAuth0Id: string): Promise<string[]>;
    create(userDto: Partial<User>): Promise<User>;
    update(id: string, userDto: Partial<User>): Promise<User>;
    remove(id: string): Promise<void>;
}
export {};
