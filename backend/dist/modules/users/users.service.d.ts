import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<{
        userRoles: ({
            role: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            roleId: string;
            userId: string;
        })[];
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        googleId: string | null;
        phone: string | null;
        avatar: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        data: {
            userRoles: ({
                role: {
                    description: string | null;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                roleId: string;
                userId: string;
            })[];
            email: string;
            firstName: string;
            lastName: string;
            id: string;
            googleId: string | null;
            phone: string | null;
            avatar: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        userRoles: ({
            role: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            roleId: string;
            userId: string;
        })[];
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        googleId: string | null;
        phone: string | null;
        avatar: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        userRoles: ({
            role: {
                description: string | null;
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            roleId: string;
            userId: string;
        })[];
        email: string;
        firstName: string;
        lastName: string;
        id: string;
        googleId: string | null;
        phone: string | null;
        avatar: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    softDelete(id: string): Promise<void>;
}
