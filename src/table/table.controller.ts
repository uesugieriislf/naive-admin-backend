import { Controller, Get, Post, UploadedFile, UseInterceptors, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TableService } from './table.service';

@Controller()
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('api/table/list')
  async getTableList(@Query() params: any) {
    return this.tableService.getTableList(params);
  }

  @Post('api/table/import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        code: 400,
        message: '请上传Excel文件'
      };
    }

    try {
      const result = await this.tableService.importExcel(file.path);
      return {
        code: 200,
        message: '导入成功',
        ...result
      };
    } catch (error) {
      return {
        code: 500,
        message: error.message || '导入失败'
      };
    }
  }
}
