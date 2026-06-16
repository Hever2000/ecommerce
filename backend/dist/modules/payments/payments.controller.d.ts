import { PaymentsService } from './payments.service';
import { CreatePreferenceResponseDto } from './dto/create-preference-response.dto';
import { WebhookQueryDto } from './dto/webhook-query.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    webhook(payload: any, signature?: string, requestId?: string, query?: WebhookQueryDto): Promise<{
        received: boolean;
    }>;
    createPreference(orderId: string): Promise<CreatePreferenceResponseDto>;
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
