import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({ data: dto });
    this.logger.log(`Category created: ${category.name}`);
    return category;
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { deletedAt: null, isActive: true },
          include: {
            children: {
              where: { deletedAt: null, isActive: true },
            },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, deletedAt: null, isActive: true },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
          include: {
            children: {
              where: { deletedAt: null, isActive: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.parentId === id) {
      throw new ConflictException('A category cannot be its own parent');
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Category updated: ${category.name}`);
    return category;
  }

  async softDelete(id: string) {
    await this.findOne(id);

    // Check if has children
    const children = await this.prisma.category.findMany({
      where: { parentId: id, deletedAt: null },
    });

    if (children.length > 0) {
      // Unlink children
      await this.prisma.category.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Category soft-deleted: ${id}`);
  }
}
