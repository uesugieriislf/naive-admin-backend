import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TableService {
  // 存储导入的数据
  private tableData: any[] = [];

  // 处理Excel文件上传和解析
  async importExcel(filePath: string): Promise<{ successCount: number; data: any[] }> {
    try {
      // 读取Excel文件
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('Excel数据读取成功，行数:', jsonData.length);
      
      // 处理数据，包括解析DISPIMG函数
      const processedData = await this.processExcelData(jsonData);
      
      // 将处理后的数据添加到存储中
      this.tableData = [...this.tableData, ...processedData];
      
      console.log('数据处理完成，成功处理:', processedData.length, '条');
      
      // 返回处理结果
      return {
        successCount: processedData.length,
        data: processedData
      };
    } catch (error) {
      console.error('Excel处理失败:', error);
      throw new Error('Excel处理失败: ' + error.message);
    } finally {
      // 清理临时文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  // 处理Excel数据，解析DISPIMG函数
  private async processExcelData(data: any[]): Promise<any[]> {
    // 跳过前3行标题行，从第4行开始处理表头
    const headerRowIndex = 3; // 第4行（索引为3）是表头
    const headerRow = data[headerRowIndex];
    
    if (!headerRow) {
      return [];
    }
    
    // 中文表头到英文key的映射
    const chineseToEnglishMap: Record<string, string> = {
      '车系': 'series',
      '序号': 'id',
      '图片': 'image',
      '金日编码': 'jinriCode',
      '车型名称': 'modelName',
      '适配年份': 'year',
      '车型问题备注': 'remarks'
    };
    
    // 提取表头映射，将__EMPTY字段映射为英文key
    const headerMap: Record<string, string> = {};
    for (const key in headerRow) {
      const headerValue = headerRow[key];
      if (headerValue && typeof headerValue === 'string' && headerValue.trim()) {
        const englishKey = chineseToEnglishMap[headerValue.trim()] || headerValue.trim();
        headerMap[key] = englishKey;
      }
    }
    
    // 从第5行开始处理实际数据，直到倒数第2行（跳过最后2行备注）
    const startDataIndex = 4; // 第5行（索引为4）开始是数据
    const endDataIndex = data.length - 2; // 跳过最后2行备注
    
    const processedData: any[] = [];
    
    for (let i = startDataIndex; i < endDataIndex; i++) {
      const item = data[i];
      if (!item) continue;
      
      // 创建处理后的项目
      const processedItem: any = {};
      
      // 映射字段名并处理数据
      for (const key in item) {
        const englishKey = headerMap[key];
        const value = item[key];
        
        if (englishKey) {
          processedItem[englishKey] = value;
        }
      }
      
      // 处理DISPIMG函数中的图片
      for (const key in item) {
        if (typeof item[key] === 'string' && item[key].includes('DISPIMG')) {
          // 提取图片ID
          const imgIdMatch = item[key].match(/DISPIMG\("([^"]+)",/);
          if (imgIdMatch && imgIdMatch[1]) {
            const imgId = imgIdMatch[1];
            console.log('找到DISPIMG图片ID:', imgId);
            
            // 添加avatar字段用于显示图片
            processedItem.avatar = `https://picsum.photos/200/200?v=${imgId}`;
          }
        }
      }
      
      // 只添加有实际数据的项目
      if (Object.keys(processedItem).length > 0) {
        processedData.push(processedItem);
      }
    }
    
    return processedData;
  }

  // 获取表格列表
  async getTableList(params: any): Promise<any> {
    // 处理分页，确保page和pageSize是数字类型
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = this.tableData.slice(start, end);
    
    return {
      code: 200,
      data: paginatedData,
      total: this.tableData.length,
      page,
      pageSize
    };
  }
}
