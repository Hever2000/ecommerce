export declare class EmailService {
    private readonly logger;
    sendOrderConfirmation(order: any): Promise<void>;
    sendPaymentApproved(order: any): Promise<void>;
    sendPaymentRejected(order: any): Promise<void>;
    sendOrderShipped(order: any): Promise<void>;
    private buildOrderEmail;
    private send;
}
