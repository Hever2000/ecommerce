import { PrismaService } from '../../prisma/prisma.service';
export declare class PermissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        module: string;
    }[]>;
    findByModule(module: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        module: string;
    }[]>;
}
