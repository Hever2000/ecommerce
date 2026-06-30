import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('VIEW_AUDIT_LOGS')
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auditService.findAll(page || 1, limit || 20);
  }
}
