import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('module/:module')
  @ApiOperation({ summary: 'Get permissions by module' })
  findByModule(@Param('module') module: string) {
    return this.permissionsService.findByModule(module);
  }
}
