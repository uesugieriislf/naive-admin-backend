import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('api/menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get('list')
  async list() {
    const result = await this.menuService.findAll();
    return {
      code: 200,
      result,
    };
  }

  @Get('tree')
  async tree() {
    const result = await this.menuService.findTree();
    return {
      code: 200,
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.menuService.findOne(Number(id));
    return {
      code: 200,
      result,
    };
  }

  @Post()
  async create(@Body() menuData: any) {
    const result = await this.menuService.create(menuData);
    return {
      code: 200,
      result,
      message: '创建成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() menuData: any) {
    const result = await this.menuService.update(Number(id), menuData);
    return {
      code: 200,
      result,
      message: '更新成功',
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.menuService.delete(Number(id));
    return {
      code: 200,
      message: '删除成功',
    };
  }
}
