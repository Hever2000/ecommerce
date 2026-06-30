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
var SupabaseStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_js_1 = require("@supabase/storage-js");
const uuid_1 = require("uuid");
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET_NAME = 'products';
let SupabaseStorageService = SupabaseStorageService_1 = class SupabaseStorageService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(SupabaseStorageService_1.name);
        const supabaseUrl = this.config.get('SUPABASE_URL');
        const serviceKey = this.config.get('SUPABASE_SERVICE_KEY');
        if (!supabaseUrl || !serviceKey) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
        }
        this.client = new storage_js_1.StorageClient(`${supabaseUrl}/storage/v1`, {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
        });
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }
    }
    generatePath(productId, originalname) {
        const dotIndex = originalname.lastIndexOf('.');
        let ext;
        let name;
        if (dotIndex > 0) {
            ext = originalname.slice(dotIndex + 1).toLowerCase();
            name = originalname.slice(0, dotIndex);
        }
        else {
            ext = 'webp';
            name = originalname;
        }
        name = name
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .toLowerCase()
            .slice(0, 40);
        const suffix = (0, uuid_1.v4)().slice(0, 8);
        return `${BUCKET_NAME}/${productId}/${name}-${suffix}.${ext}`;
    }
    async upload(params) {
        const { file, path, contentType } = params;
        try {
            const { error } = await this.client.from(BUCKET_NAME).upload(path, file.buffer, {
                contentType,
                upsert: true,
            });
            if (error)
                throw error;
            const supabaseUrl = this.config.get('SUPABASE_URL');
            const url = `${supabaseUrl}/storage/v1/object/public/${path}`;
            this.logger.log(`File uploaded: ${url}`);
            return { url, path, bucket: BUCKET_NAME, contentType, size: file.size };
        }
        catch (error) {
            this.logger.error(`Supabase upload failed: ${error}`, error.stack);
            throw new common_1.BadRequestException('Failed to upload file');
        }
    }
    async delete(path) {
        try {
            const { error } = await this.client.from(BUCKET_NAME).remove([path]);
            if (error)
                throw error;
            this.logger.log(`File deleted: ${path}`);
            return { path, bucket: BUCKET_NAME };
        }
        catch (error) {
            this.logger.error(`Supabase delete failed: ${error}`, error.stack);
            throw new common_1.BadRequestException('Failed to delete file');
        }
    }
    extractPathFromUrl(url) {
        const prefix = `/storage/v1/object/public/`;
        const idx = url.indexOf(prefix);
        if (idx === -1)
            return null;
        return url.slice(idx + prefix.length);
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = SupabaseStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseStorageService);
//# sourceMappingURL=supabase-storage.service.js.map