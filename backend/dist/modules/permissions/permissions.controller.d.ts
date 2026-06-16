import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
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
