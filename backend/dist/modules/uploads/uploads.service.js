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
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const AWS = require("aws-sdk");
let UploadsService = UploadsService_1 = class UploadsService {
    constructor() {
        this.logger = new common_1.Logger(UploadsService_1.name);
        AWS.config.update({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
        this.s3 = new AWS.S3();
    }
    getBucket() {
        return process.env.AWS_S3_BUCKET || 'ecommerce-aws-products';
    }
    async uploadFile(file, folder = 'products') {
        const key = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        try {
            await this.s3
                .upload({
                Bucket: this.getBucket(),
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            })
                .promise();
            const url = `https://${this.getBucket()}.s3.amazonaws.com/${key}`;
            this.logger.log(`File uploaded: ${url}`);
            return url;
        }
        catch (error) {
            this.logger.error(`S3 upload failed: ${error}`);
            throw new common_1.BadRequestException('Failed to upload file');
        }
    }
    async uploadMultiple(files, folder = 'products') {
        const uploads = files.map((file) => this.uploadFile(file, folder));
        return Promise.all(uploads);
    }
    async deleteFile(url) {
        const key = url.split('.amazonaws.com/')[1];
        if (!key) {
            this.logger.warn(`Invalid S3 URL: ${url}`);
            return;
        }
        try {
            await this.s3
                .deleteObject({
                Bucket: this.getBucket(),
                Key: key,
            })
                .promise();
            this.logger.log(`File deleted: ${key}`);
        }
        catch (error) {
            this.logger.error(`S3 delete failed: ${error}`);
        }
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map