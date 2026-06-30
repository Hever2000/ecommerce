"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializeInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const library_1 = require("@prisma/client/runtime/library");
let SerializeInterceptor = class SerializeInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => this.transform(data)));
    }
    transform(value) {
        if (value === null || value === undefined)
            return value;
        if (value instanceof library_1.Decimal) {
            return Number(value.toString());
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.transform(item));
        }
        if (typeof value === 'object') {
            const obj = value;
            for (const key of Object.keys(obj)) {
                obj[key] = this.transform(obj[key]);
            }
            return obj;
        }
        return value;
    }
};
exports.SerializeInterceptor = SerializeInterceptor;
exports.SerializeInterceptor = SerializeInterceptor = __decorate([
    (0, common_1.Injectable)()
], SerializeInterceptor);
//# sourceMappingURL=serialize.interceptor.js.map