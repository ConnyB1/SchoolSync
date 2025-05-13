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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ClassesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_entity_1 = require("./class.entity");
const user_entity_1 = require("../users/user.entity");
const users_service_1 = require("../users/users.service");
const sendgrid_service_1 = require("../sendgrid/sendgrid.service");
const XLSX = require("xlsx");
let ClassesService = ClassesService_1 = class ClassesService {
    classesRepository;
    usersRepository;
    usersService;
    sendgridService;
    logger = new common_1.Logger(ClassesService_1.name);
    constructor(classesRepository, usersRepository, usersService, sendgridService) {
        this.classesRepository = classesRepository;
        this.usersRepository = usersRepository;
        this.usersService = usersService;
        this.sendgridService = sendgridService;
    }
    generateAccessCode(length = 6) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    async create(createClassDto, teacherAuth0Id) {
        const teacher = await this.usersService.findOneByAuth0Id(teacherAuth0Id);
        if (!teacher) {
            throw new common_1.NotFoundException(`Maestro con Auth0 ID ${teacherAuth0Id} no encontrado.`);
        }
        if (!teacher.roles || !teacher.roles.includes('Profesor')) {
            throw new common_1.ForbiddenException('Solo los maestros pueden crear clases.');
        }
        let accessCode = this.generateAccessCode();
        let existingClassByCode = await this.classesRepository.findOne({ where: { accessCode } });
        while (existingClassByCode) {
            accessCode = this.generateAccessCode();
            existingClassByCode = await this.classesRepository.findOne({ where: { accessCode } });
        }
        const newClass = this.classesRepository.create({
            ...createClassDto,
            teacher,
            accessCode,
            students: [],
        });
        try {
            return await this.classesRepository.save(newClass);
        }
        catch (error) {
            if (error.code === '23505') {
                throw new common_1.ConflictException('Ya existe una clase con un nombre similar o código de acceso.');
            }
            this.logger.error('Error creando clase:', error);
            throw new common_1.InternalServerErrorException('No se pudo crear la clase.');
        }
    }
    async joinClass(joinClassDto, studentAuth0Id) {
        const student = await this.usersService.findOneByAuth0Id(studentAuth0Id);
        if (!student) {
            throw new common_1.NotFoundException(`Alumno con Auth0 ID ${studentAuth0Id} no encontrado.`);
        }
        if (!student.roles || !student.roles.includes('alumno')) {
            throw new common_1.ForbiddenException('Solo los alumnos pueden unirse a clases.');
        }
        const classToJoin = await this.classesRepository.findOne({
            where: { accessCode: joinClassDto.accessCode },
            relations: ['students', 'teacher'],
        });
        if (!classToJoin) {
            throw new common_1.NotFoundException(`Clase con código de acceso "${joinClassDto.accessCode}" no encontrada.`);
        }
        const isAlreadyEnrolled = classToJoin.students.some(s => s.id === student.id);
        if (isAlreadyEnrolled) {
            this.logger.log(`El alumno ${student.email} ya está inscrito en la clase ${classToJoin.name}`);
            return classToJoin;
        }
        if (classToJoin.teacherId === student.id) {
            throw new common_1.BadRequestException('Un maestro no puede unirse a su propia clase como alumno.');
        }
        classToJoin.students.push(student);
        await this.classesRepository.save(classToJoin);
        this.logger.log(`Alumno ${student.email} unido a la clase ${classToJoin.name}`);
        return classToJoin;
    }
    async findAllForUser(userAuth0Id) {
        const user = await this.usersService.findOneByAuth0Id(userAuth0Id);
        if (!user) {
            throw new common_1.NotFoundException(`Usuario con Auth0 ID ${userAuth0Id} no encontrado.`);
        }
        if (user.roles?.includes('Profesor') || user.roles?.includes('maestro')) {
            return this.classesRepository.find({
                where: { teacher: { id: user.id } },
                relations: ['teacher', 'students'],
            });
        }
        else if (user.roles?.includes('alumno')) {
            const userWithClasses = await this.usersRepository.findOne({
                where: { id: user.id },
                relations: ['classes', 'classes.teacher', 'classes.students'],
            });
            return userWithClasses?.classes || [];
        }
        return [];
    }
    async findById(id, userAuth0Id) {
        const cls = await this.classesRepository.findOne({ where: { id }, relations: ['teacher', 'students'] });
        if (!cls) {
            throw new common_1.NotFoundException(`Clase con ID ${id} no encontrada.`);
        }
        const user = await this.usersService.findOneByAuth0Id(userAuth0Id);
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado.');
        const isTeacher = cls.teacher.id === user.id;
        const isStudent = cls.students.some(s => s.id === user.id);
        if (!isTeacher && !isStudent && !user.roles?.includes('admin')) {
            throw new common_1.ForbiddenException('No tienes acceso a esta clase.');
        }
        return cls;
    }
    async importClassesFromExcel(fileBuffer, currentUserAuth0Id) {
        this.logger.log(`Iniciando importación de clases para el usuario ${currentUserAuth0Id}`);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        let createdCount = 0;
        let updatedCount = 0;
        const errors = [];
        const importingUser = await this.usersService.findOneByAuth0Id(currentUserAuth0Id);
        if (!importingUser || !importingUser.roles?.includes('Profesor')) {
            throw new common_1.ForbiddenException('Solo maestros o administradores pueden importar clases.');
        }
        for (const row of jsonData) {
            try {
                if (!row.Clase || !row.Codigo || !row.Profesor) {
                    errors.push({ row, error: 'Datos incompletos: Clase, Código y Maestro son requeridos.' });
                    continue;
                }
                let teacher = await this.usersService.findOneByEmail(row.Profesor.trim());
                if (!teacher) {
                    if (importingUser.email.toLowerCase() !== row.Profesor.trim().toLowerCase()) {
                        errors.push({ row, error: `El maestro ${row.Profesor} no existe o no coincide con el usuario importador.` });
                        continue;
                    }
                    teacher = importingUser;
                }
                else {
                    if (!teacher.roles?.includes('Profesor')) {
                        errors.push({ row, error: `El usuario ${teacher.email} no tiene el rol de maestro.` });
                        continue;
                    }
                }
                let classEntity = await this.classesRepository.findOne({ where: { accessCode: row.Codigo.toString() }, relations: ['teacher', 'students'] });
                if (classEntity) {
                    if (classEntity.teacher.id !== teacher.id) {
                        errors.push({ row, error: `El código de clase ${row.Codigo} ya existe y pertenece a otro maestro.` });
                        continue;
                    }
                    classEntity.name = row.Clase;
                    updatedCount++;
                }
                else {
                    classEntity = this.classesRepository.create({
                        name: row.Clase,
                        accessCode: row.Codigo.toString(),
                        teacher: teacher,
                        students: [],
                    });
                    createdCount++;
                }
                const studentEmailsString = row.Alumnos?.toString() || '';
                const studentEmails = studentEmailsString.split(',').map(email => email.trim()).filter(email => email);
                const existingStudentsInClass = new Set(classEntity.students.map(s => s.email));
                if (studentEmails.length > 0) {
                    for (const email of studentEmails) {
                        if (existingStudentsInClass.has(email.toLowerCase()))
                            continue;
                        let student = await this.usersService.findOneByEmail(email.toLowerCase());
                        if (!student) {
                            this.logger.log(`Alumno con email ${email} no encontrado. Se enviará invitación.`);
                        }
                        else {
                            if (!student.roles?.includes('alumno')) {
                                errors.push({ row, error: `El usuario ${student.email} existe pero no es un alumno.` });
                                continue;
                            }
                            classEntity.students.push(student);
                        }
                        await this.sendgridService.sendClassInvitationEmail(email, classEntity.name, classEntity.accessCode, teacher.Nombre || teacher.email);
                    }
                }
                await this.classesRepository.save(classEntity);
            }
            catch (error) {
                this.logger.error(`Error procesando fila de Excel para clase ${row.Clase}: ${error.message}`, error.stack);
                errors.push({ row: row.Clase, error: error.message });
            }
        }
        this.logger.log(`Importación finalizada. Creadas: ${createdCount}, Actualizadas: ${updatedCount}, Errores: ${errors.length}`);
        return { created: createdCount, updated: updatedCount, errors };
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = ClassesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        sendgrid_service_1.SendGridService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map