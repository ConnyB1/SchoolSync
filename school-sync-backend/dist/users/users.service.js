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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const auth0_service_1 = require("../auth/auth0.service");
let UsersService = UsersService_1 = class UsersService {
    usersRepository;
    auth0Service;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(usersRepository, auth0Service) {
        this.usersRepository = usersRepository;
        this.auth0Service = auth0Service;
    }
    async findAll() {
        return this.usersRepository.find({ relations: ['classes', 'teachingClasses'] });
    }
    async findOneById(id) {
        return this.usersRepository.findOne({ where: { id }, relations: ['classes', 'teachingClasses'] });
    }
    async findOneByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findOneByAuth0Id(auth0Id) {
        return this.usersRepository.findOne({ where: { auth0Id }, relations: ['classes', 'teachingClasses', 'roles'] });
    }
    async findOrCreateByAuth0Profile(profileData) {
        this.logger.debug(`Buscando o creando usuario para Auth0 ID: ${profileData.auth0Id}`);
        let user = await this.usersRepository.findOne({ where: { auth0Id: profileData.auth0Id } });
        if (user) {
            this.logger.log(`Usuario encontrado localmente: ${user.id} para Auth0 ID: ${profileData.auth0Id}`);
            let updated = false;
            if (profileData.Nombre && user.Nombre !== profileData.Nombre) {
                user.Nombre = profileData.Nombre;
                updated = true;
            }
            if (profileData.Apellido && user.Apellido !== profileData.Apellido) {
                user.Apellido = profileData.Apellido;
                updated = true;
            }
            if (profileData.picture && user.picture !== profileData.picture) {
                user.picture = profileData.picture;
                updated = true;
            }
            if (profileData.rolesFromAuth0 && JSON.stringify(user.roles?.sort()) !== JSON.stringify(profileData.rolesFromAuth0.sort())) {
                this.logger.log(`Actualizando roles para usuario ${user.id}. Roles anteriores: ${user.roles?.join(', ')}. Nuevos roles de Auth0: ${profileData.rolesFromAuth0.join(', ')}`);
                user.roles = [...profileData.rolesFromAuth0].sort();
                updated = true;
            }
            if (updated) {
                try {
                    await this.usersRepository.save(user);
                    this.logger.log(`Usuario ${user.id} actualizado.`);
                }
                catch (error) {
                    this.logger.error(`Error actualizando usuario ${user.id}: ${error.message}`, error.stack);
                    throw new common_1.InternalServerErrorException('Error al actualizar el perfil del usuario.');
                }
            }
            return user;
        }
        else {
            this.logger.log(`Usuario no encontrado localmente para Auth0 ID: ${profileData.auth0Id}. Creando nuevo usuario.`);
            const newUser = this.usersRepository.create({
                auth0Id: profileData.auth0Id,
                email: profileData.email,
                Nombre: profileData.Nombre,
                Apellido: profileData.Apellido,
                picture: profileData.picture,
                roles: profileData.rolesFromAuth0 ? [...profileData.rolesFromAuth0].sort() : [],
            });
            try {
                const savedUser = await this.usersRepository.save(newUser);
                this.logger.log(`Nuevo usuario creado localmente con ID: ${savedUser.id} para Auth0 ID: ${profileData.auth0Id}`);
                return savedUser;
            }
            catch (error) {
                this.logger.error(`Error creando nuevo usuario: ${error.message}`, error.stack);
                if (error.code === '23505') {
                    this.logger.warn(`Conflicto al crear usuario: Datos (ej. email) podrían ya existir. Auth0 ID: ${profileData.auth0Id}, Email: ${profileData.email}`);
                    throw new common_1.BadRequestException('Error al crear usuario: Ya existe un usuario con datos similares.');
                }
                throw new common_1.InternalServerErrorException('Error al guardar el nuevo usuario.');
            }
        }
    }
    async linkParentToStudent(parentAuth0Id, studentAuth0Id) {
        this.logger.log(`Intentando vincular alumno ${studentAuth0Id} con padre ${parentAuth0Id}`);
        const managementClient = this.auth0Service.getManagementClient();
        try {
            const [parentUserAuth0, studentUserAuth0] = await Promise.all([
                managementClient.users.get({ id: parentAuth0Id }).catch(() => null),
                managementClient.users.get({ id: studentAuth0Id }).catch(() => null),
            ]);
            if (!parentUserAuth0) {
                this.logger.warn(`Padre con Auth0 ID ${parentAuth0Id} no encontrado en Auth0.`);
                throw new common_1.NotFoundException(`Padre con ID ${parentAuth0Id} no encontrado en Auth0.`);
            }
            if (!studentUserAuth0) {
                this.logger.warn(`Alumno con Auth0 ID ${studentAuth0Id} no encontrado en Auth0.`);
                throw new common_1.NotFoundException(`Alumno con ID ${studentAuth0Id} no encontrado en Auth0.`);
            }
            const appMetadata = parentUserAuth0.app_metadata || {};
            const linkedStudents = appMetadata.linked_students || [];
            if (!linkedStudents.includes(studentAuth0Id)) {
                linkedStudents.push(studentAuth0Id);
                await managementClient.users.update({ id: parentAuth0Id }, { app_metadata: { ...appMetadata, linked_students: linkedStudents } });
                this.logger.log(`Alumno ${studentAuth0Id} vinculado exitosamente al padre ${parentAuth0Id} en Auth0.`);
            }
            else {
                this.logger.log(`Alumno ${studentAuth0Id} ya está vinculado al padre ${parentAuth0Id} en Auth0.`);
            }
        }
        catch (error) {
            this.logger.error(`Error vinculando padre ${parentAuth0Id} con alumno ${studentAuth0Id} vía Auth0: ${error.message}`, error.stack);
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException('Fallo al vincular padre con alumno vía Auth0.');
        }
    }
    async getLinkedStudentsForParent(parentAuth0Id) {
        this.logger.debug(`Obteniendo alumnos vinculados para el padre ${parentAuth0Id}`);
        const managementClient = this.auth0Service.getManagementClient();
        try {
            const parentResponse = await managementClient.users.get({ id: parentAuth0Id });
            const parent = parentResponse;
            return parent.app_metadata?.linked_students || [];
        }
        catch (error) {
            this.logger.error(`Error obteniendo alumnos vinculados para padre ${parentAuth0Id} desde Auth0: ${error.message}`, error.stack);
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Padre con Auth0 ID ${parentAuth0Id} no encontrado en Auth0.`);
            }
            throw new common_1.InternalServerErrorException('Error al obtener información del padre desde Auth0.');
        }
    }
    async create(userDto) {
        this.logger.log(`Creando usuario manualmente: ${userDto.email}`);
        const newUser = this.usersRepository.create(userDto);
        try {
            return await this.usersRepository.save(newUser);
        }
        catch (error) {
            this.logger.error(`Error creando usuario manualmente: ${error.message}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.BadRequestException('Usuario con este email o identificador ya existe.');
            }
            throw new common_1.InternalServerErrorException('Error al crear el usuario.');
        }
    }
    async update(id, userDto) {
        this.logger.log(`Actualizando usuario con ID local: ${id}`);
        const userToUpdate = await this.findOneById(id);
        if (!userToUpdate) {
            this.logger.warn(`Intento de actualizar usuario no encontrado con ID local: ${id}`);
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado.`);
        }
        Object.assign(userToUpdate, userDto);
        try {
            await this.usersRepository.save(userToUpdate);
            return userToUpdate;
        }
        catch (error) {
            this.logger.error(`Error actualizando usuario con ID local ${id}: ${error.message}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.BadRequestException('Error al actualizar: Los datos entran en conflicto con otro usuario.');
            }
            throw new common_1.InternalServerErrorException('Error al actualizar el usuario.');
        }
    }
    async remove(id) {
        this.logger.log(`Eliminando usuario con ID local: ${id}`);
        const user = await this.findOneById(id);
        if (!user) {
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado para eliminar.`);
        }
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            this.logger.warn(`Intento de eliminar usuario con ID local ${id} falló (affected rows = 0).`);
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado o ya eliminado.`);
        }
        this.logger.log(`Usuario con ID local ${id} eliminado.`);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        auth0_service_1.Auth0Service])
], UsersService);
//# sourceMappingURL=users.service.js.map