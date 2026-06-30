import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @Permissions('MANAGE_EMPLOYEES')
  @ApiOperation({ summary: 'Create a new user (employee)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  @Permissions('MANAGE_EMPLOYEES')
  @ApiOperation({ summary: 'List all users' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(page || 1, limit || 10);
  }

  @Get(':id')
  @Roles('ADMIN')
  @Permissions('MANAGE_EMPLOYEES')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions('MANAGE_EMPLOYEES')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('MANAGE_EMPLOYEES')
  @ApiOperation({ summary: 'Soft delete user' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDelete(id);
  }
}
