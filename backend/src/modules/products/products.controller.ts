import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('CREATE_PRODUCT')
  @ApiOperation({ summary: 'Create a product with variants' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('UPDATE_PRODUCT')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('UPDATE_PRODUCT')
  @ApiOperation({ summary: 'Upload image for product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.uploadImage(id, file);
  }

  @Post(':id/images/multiple')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('UPDATE_PRODUCT')
  @ApiOperation({ summary: 'Upload multiple images for product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.uploadMultipleImages(id, files);
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('UPDATE_PRODUCT')
  @ApiOperation({ summary: 'Delete product image' })
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    await this.productsService.deleteImage(id, imageId);
    return { deleted: true };
  }

  @Patch(':id/images/reorder')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('UPDATE_PRODUCT')
  @ApiOperation({ summary: 'Reorder product images' })
  async reorderImages(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderImagesDto) {
    await this.productsService.reorderImages(id, dto.imageIds);
    return { reordered: true };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('DELETE_PRODUCT')
  @ApiOperation({ summary: 'Soft delete product with S3 image cleanup' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.softDelete(id);
  }
}
