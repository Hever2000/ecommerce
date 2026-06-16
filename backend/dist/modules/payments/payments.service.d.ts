import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class PaymentsService {
    private prisma;
    private config;
    private readonly logger;
    private readonly mpClient;
    private readonly preference;
    private readonly mpPayment;
    constructor(prisma: PrismaService, config: ConfigService);
    createPreference(orderId: string): Promise<{
        preferenceId: string;
        initPoint: string;
        sandboxInitPoint: string;
        items: {
            id: string;
            title: string;
            quantity: number;
            unitPrice: number;
        }[];
        total: number;
    }>;
    handleWebhook(body: any, headers: {
        'x-signature'?: string;
        'x-request-id'?: string;
    }, queryDataId?: string): Promise<{
        received: boolean;
    }>;
    getPaymentByOrder(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        mpPreferenceId: string | null;
        mpPaymentId: string | null;
        mpStatus: string | null;
        mpStatusDetail: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
    }[]>;
}
