import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { module: 'asc' },
    });
  }

  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module },
    });
  }
}
