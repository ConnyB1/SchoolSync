import { Class } from '../classes/class.entity';
export declare class User {
    id: string;
    auth0Id: string;
    email: string;
    passwordHash?: string;
    Nombre?: string;
    Apellido?: string;
    picture?: string;
    roles?: string[];
    createdAt: Date;
    updatedAt: Date;
    teachingClasses: Class[];
    classes: Class[];
}
