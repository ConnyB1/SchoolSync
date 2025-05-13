import { User } from '../users/user.entity';
export declare class Class {
    id: string;
    name: string;
    description?: string;
    accessCode: string;
    teacher: User;
    teacherId: string;
    students: User[];
    createdAt: Date;
    updatedAt: Date;
}
