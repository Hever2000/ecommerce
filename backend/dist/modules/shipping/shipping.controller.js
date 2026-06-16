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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shipping_service_1 = require("./shipping.service");
const calculate_shipping_dto_1 = require("./dto/calculate-shipping.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let ShippingController = class ShippingController {
    constructor(shippingService) {
        this.shippingService = shippingService;
    }
    calculate(dto) {
        return this.shippingService.calculateCost(dto.province, dto.subtotal, dto.itemCount);
    }
    getPickup() {
        return this.shippingService.getPickupCost();
    }
};
exports.ShippingController = ShippingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('calculate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate shipping cost' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_shipping_dto_1.CalculateShippingDto]),
    __metadata("design:returntype", void 0)
], ShippingController.prototype, "calculate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('pickup'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pickup shipping info' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ShippingController.prototype, "getPickup", null);
exports.ShippingController = ShippingController = __decorate([
    (0, swagger_1.ApiTags)('Shipping'),
    (0, common_1.Controller)('shipping'),
    __metadata("design:paramtypes", [shipping_service_1.ShippingService])
], ShippingController);
//# sourceMappingURL=shipping.controller.js.map