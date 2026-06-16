import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RolesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateRoleDto): Promise<{
        rolePermissions: ({
            permission: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                module: string;
            };
        } & {
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        rolePermissions: ({
            permission: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                module: string;
            };
        } & {
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        rolePermissions: ({
            permission: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                module: string;
            };
        } & {
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePermissions(id: string, permissionIds: string[]): Promise<{
        rolePermissions: ({
            permission: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                module: string;
            };
        } & {
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<void>;
}
