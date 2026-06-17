# AWS S3 - Gestión de Imágenes de Productos

## Arquitectura

```
Admin Next.js (ImageDropzone / ImageGalleryEditor)
        │
        ▼
NestJS API (ProductsController → ProductsService)
        │
        ▼
StorageService (AWS SDK v3 — @aws-sdk/client-s3)
        │
        ▼
    S3 Bucket
  (ecommerce-bucket-santiagocoronel)
        │
        ▼
   PostgreSQL (product_images)
```

## Flujo de Upload

1. Admin arrastra imágenes en `ImageDropzone` (frontend admin)
2. Frontend envía archivos a `POST /products/:id/images/multiple`
3. `ProductsController` recibe el multipart y delega a `ProductsService`
4. `ProductsService` valida el archivo vía `StorageService.validateFile()`:
   - Tipo MIME: `image/jpeg`, `image/png`, `image/webp`
   - Tamaño máximo: 10MB
5. `StorageService.generateKey()` genera la key:
   ```
   products/{productId}/{sanitized-name}-{uuid8}.{ext}
   ```
6. `StorageService.upload()` ejecuta `PutObjectCommand` con SDK v3
7. Se guarda registro en `product_images` con la URL pública
8. Se devuelve el registro al frontend

## Flujo de Eliminación

### Eliminar imagen individual
1. `DELETE /products/:id/images/:imageId`
2. Busca registro en `product_images`
3. Extrae key de la URL vía `extractKeyFromUrl()`
4. `DeleteObjectCommand` → elimina objeto de S3
5. Elimina registro de `product_images`

### Eliminar producto (soft delete con cleanup)
1. `DELETE /products/:id`
2. Busca todas las imágenes del producto en `product_images`
3. Por cada imagen: extrae key → elimina de S3
4. Soft-delete del producto (`deletedAt`, `isActive: false`)
5. Las imágenes en DB se mantienen (soft-delete), pero S3 se limpia

## Estructura del Bucket

```
ecommerce-bucket-santiagocoronel/
├── products/
│   ├── {productId}/
│   │   ├── front-a1b2c3d4.webp
│   │   ├── back-e5f6g7h8.jpeg
│   │   └── lifestyle-i9j0k1l2.png
│   └── {otroProductId}/
│       └── ...
```

## Endpoints

| Método  | Endpoint                              | Auth                | Descripción                     |
|---------|---------------------------------------|---------------------|----------------------------------|
| POST    | `/products/:id/images`                | ADMIN, EMPLOYEE     | Subir 1 imagen                  |
| POST    | `/products/:id/images/multiple`       | ADMIN, EMPLOYEE     | Subir múltiples imágenes (máx 10) |
| DELETE  | `/products/:id/images/:imageId`       | ADMIN, EMPLOYEE     | Eliminar imagen                 |
| PATCH   | `/products/:id/images/reorder`        | ADMIN, EMPLOYEE     | Reordenar imágenes              |
| DELETE  | `/products/:id`                       | ADMIN, EMPLOYEE     | Soft-delete + cleanup S3        |

## Validaciones

- **Tipos permitidos**: `image/jpeg`, `image/png`, `image/webp`
- **Tamaño máximo**: 10 MB por archivo
- **Validación**: server-side via `StorageService.validateFile()`
- **Key sanitization**: se limpian caracteres especiales del nombre original

## Variables de Entorno

```bash
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=ecommerce-bucket-santiagocoronel
```

## Migración a Bucket Privado + Presigned URLs + CloudFront

La arquitectura está preparada para migrar a un bucket privado sin reescribir la lógica.

### Pasos futuros

1. **Cambiar bucket a privado**:
   - Quitar `BlockPublicAccess` en Terraform
   - Crear CloudFront OAC (Origin Access Control)

2. **Agregar Presigned URLs**:
   - En `IStorageService`, agregar métodos:
     ```typescript
     getPresignedUploadUrl(key: string): Promise<string>;
     getPresignedDownloadUrl(key: string): Promise<string>;
     ```
   - Usar `@aws-sdk/s3-request-presigner` + `GetObjectCommand` / `PutObjectCommand`
   - Generar URLs firmadas con expiración (ej: 3600s para download, 900s para upload)

3. **CloudFront distribution**:
   - Apuntar CloudFront al bucket con OAC
   - Actualizar `remotePatterns` en `next.config.js` con el dominio de CloudFront
   - Opcional: agregar Lambda@Edge para autenticación en edge

4. **Actualizar StorageService**:
   - `upload()` → usar presigned URL en lugar de `PutObjectCommand` directo
   - `getPublicUrl()` → devolver URL de CloudFront + presigned query params
   - La interfaz `IStorageService` ya define el contrato; solo cambia la implementación

### Lo que NO cambia

- `ProductsService` no toca S3 directamente, solo llama a `StorageService`
- `ProductsController` no cambia
- Frontend sigue recibiendo URLs del backend
- La estructura de keys en S3 se mantiene

## Testing

```bash
# Unit tests
cd backend
npx jest storage.service.spec

# Integration tests
npx jest storage.integration.spec
```

Los tests unitarios cubren:
- Validación de archivos (tipos, tamaño)
- Generación de keys
- Construcción de URLs
- Extracción de keys desde URLs

Los tests de integración cubren:
- Upload con mock de S3Client
- Delete con mock de S3Client
- Manejo de errores de red
