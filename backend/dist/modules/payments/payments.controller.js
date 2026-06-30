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
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const parse_uuid_pipe_1 = require("../../common/pipes/parse-uuid.pipe");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(PaymentsController_1.name);
    }
    async webhook(payload, signature, requestId, topic, queryId, dataId, queryType) {
        const headers = { 'x-signature': signature, 'x-request-id': requestId };
        this.paymentsService.validateWebhookSignature(headers, dataId || queryId);
        const paymentId = payload?.data?.id || queryId || dataId;
        if (paymentId) {
            this.paymentsService
                .processWebhook('payment', String(paymentId))
                .catch((err) => this.logger.error(`Webhook processing failed: ${err.message}`, err.stack));
        }
        else {
            this.logger.log(`Webhook received without payment ID — topic: ${topic || queryType || 'unknown'}, body: ${JSON.stringify(payload).slice(0, 500)}`);
        }
        return { received: true };
    }
    async createPreference(orderId) {
        return this.paymentsService.createPreference(orderId);
    }
    getPaymentByOrder(orderId) {
        return this.paymentsService.getPaymentByOrder(orderId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Mercado Pago webhook endpoint (IPN)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-signature')),
    __param(2, (0, common_1.Headers)('x-request-id')),
    __param(3, (0, common_1.Query)('topic')),
    __param(4, (0, common_1.Query)('id')),
    __param(5, (0, common_1.Query)('data.id')),
    __param(6, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "webhook", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':orderId/preference'),
    (0, swagger_1.ApiOperation)({ summary: 'Create payment preference for order' }),
    __param(0, (0, common_1.Param)('orderId', parse_uuid_pipe_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPreference", null);
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'EMPLOYEE'),
    (0, permissions_decorator_1.Permissions)('VIEW_ORDERS'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payments for order' }),
    __param(0, (0, common_1.Param)('orderId', parse_uuid_pipe_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPaymentByOrder", null);
exports.PaymentsController = PaymentsController = PaymentsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map