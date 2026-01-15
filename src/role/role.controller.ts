import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RoleService } from './role.service';

@Controller('api/role')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get('list')
  async list(@Query() query: any) {
    const result = await this.roleService.findAll(query);
    return {
      code: 200,
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.roleService.findOne(Number(id));
    return {
      code: 200,
      result,
    };
  }

  @Post()
  async create(@Body() roleData: any) {
    const result = await this.roleService.create(roleData);
    return {
      code: 200,
      result,
      message: '创建成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() roleData: any) {
    const result = await this.roleService.update(Number(id), roleData);
    return {
      code: 200,
      result,
      message: '更新成功',
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.roleService.delete(Number(id));
    return {
      code: 200,
      message: '删除成功',
    };
  }
}
