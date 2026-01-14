import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as XlsxPopulate from 'xlsx-populate';
import * as JSZip from 'jszip';

@Injectable()
export class TableService {
  private tableData: any[] = [];
  private serverUrl: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SERVER_HOST', 'localhost');
    const port = this.configService.get<string>('SERVER_PORT', '3001');
    this.serverUrl = `http://${host}:${port}`;
  }

  // 处理Excel文件上传和解析
  async importExcel(filePath: string): Promise<{ successCount: number; data: any[] }> {
    try {
      // 确保图片存储目录存在
      const imagesDir = './uploads/images';
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // 读取Excel文件
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('Excel数据读取成功，行数:', jsonData.length);
      
      // 使用ExcelJS提取图片
      const imageMap = await this.extractImages(filePath, imagesDir);
      console.log('图片提取成功，数量:', Object.keys(imageMap).length);
      
      // 处理数据，包括解析DISPIMG函数和替换图片路径
      const processedData = await this.processExcelData(jsonData, imageMap, imagesDir);
      
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

  // 提取Excel中的图片（包括DISPIMG类型）
  private async extractImages(filePath: string, imagesDir: string): Promise<Record<string, string>> {
    const imageMap: Record<string, string> = {};
    
    // 确保目录存在
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // 方法1: 使用 JSZip 直接解压 Excel 文件，从 xl/media 目录提取图片（最可靠的方法）
    try {
      console.log('开始使用 JSZip 提取图片...');
      const jszipResult = await this.extractImagesWithJSZip(filePath, imagesDir);
      
      // 将提取的图片添加到映射中
      jszipResult.imageMap.forEach((fileName, imageName) => {
        const imageUrl = `${this.serverUrl}/uploads/images/${fileName}`;
        imageMap[imageName] = imageUrl;
        console.log(`添加 JSZip 图片映射: ${imageName} -> ${imageUrl}`);
      });
      
      // 如果提取到了图片，直接返回
      if (Object.keys(imageMap).length > 0) {
        console.log(`JSZip 提取完成，共提取 ${Object.keys(imageMap).length} 张图片`);
        return imageMap;
      }
    } catch (error) {
      console.error('使用 JSZip 提取图片失败:', error);
    }
    
    // 方法2: 先尝试使用 xlsx-populate 提取 DISPIMG 图片
    try {
      console.log('开始使用 xlsx-populate 提取 DISPIMG 图片...');
      const dispimgResult = await this.extractDISPIMGImages(filePath, imagesDir);
      
      // 将提取的 DISPIMG 图片添加到映射中
      dispimgResult.imageMap.forEach((fileName, imageName) => {
        const imageUrl = `${this.serverUrl}/uploads/images/${fileName}`;
        imageMap[imageName] = imageUrl;
        console.log(`添加 DISPIMG 图片映射: ${imageName} -> ${imageUrl}`);
      });
      
      // 如果提取到了 DISPIMG 图片，直接返回
      if (Object.keys(imageMap).length > 0) {
        console.log(`xlsx-populate 提取完成，共提取 ${Object.keys(imageMap).length} 张图片`);
        return imageMap;
      }
    } catch (error) {
      console.error('使用 xlsx-populate 提取 DISPIMG 图片失败:', error);
    }
    
    // 方法3: 如果 xlsx-populate 提取失败，尝试使用 ExcelJS 提取普通图片
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      console.log('开始使用 ExcelJS 提取普通图片...');
      
      // 遍历所有工作表
      for (const worksheet of workbook.worksheets) {
        console.log(`处理工作表: ${worksheet.name}`);
        
        // 检查工作表是否有图片（ExcelJS 3.x版本的方式）
        const worksheetWithImages = worksheet as any;
        
        // 尝试不同的图片存储位置
        let images: any[] = [];
        
        // 方式1: 直接在工作表上查找图片
        if (worksheetWithImages.images && Array.isArray(worksheetWithImages.images)) {
          images = worksheetWithImages.images;
          console.log(`方式1找到 ${images.length} 张图片`);
        }
        // 方式2: 在drawings中查找图片
        else if (worksheetWithImages._drawings && Array.isArray(worksheetWithImages._drawings)) {
          images = worksheetWithImages._drawings.filter((d: any) => d.imageId || d.image);
          console.log(`方式2找到 ${images.length} 张图片`);
        }
        // 方式3: 在model中查找图片
        else if (worksheetWithImages.model && worksheetWithImages.model.media) {
          images = worksheetWithImages.model.media;
          console.log(`方式3找到 ${images.length} 张图片`);
        }
        // 方式4: 在workbook中查找图片
        else if (workbook.model && workbook.model.media) {
          images = workbook.model.media;
          console.log(`方式4找到 ${images.length} 张图片`);
        }
        
        console.log(`工作表 ${worksheet.name} 中找到 ${images.length} 张图片`);
        
        // 处理每张图片
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          console.log(`处理图片 ${i+1}:`, JSON.stringify(image, (key, value) => {
            if (key === 'buffer' || key === 'imageBuffer') return '[Buffer]';
            return value;
          }, 2));
          
          try {
            // 尝试不同的方式获取图片缓冲区
            let imageBuffer: Buffer | undefined;
            
            // 方式1: 直接使用image.buffer
            if (image.buffer) {
              imageBuffer = Buffer.isBuffer(image.buffer) ? image.buffer : Buffer.from(image.buffer);
              console.log('使用方式1获取图片缓冲区');
            }
            // 方式2: 使用image.imageBuffer
            else if (image.imageBuffer) {
              imageBuffer = Buffer.isBuffer(image.imageBuffer) ? image.imageBuffer : Buffer.from(image.imageBuffer);
              console.log('使用方式2获取图片缓冲区');
            }
            // 方式3: 使用image.data
            else if (image.data) {
              imageBuffer = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
              console.log('使用方式3获取图片缓冲区');
            }
            // 方式4: 通过rId在workbook.model.media中查找
            else if (image.rId && workbook.model && workbook.model.media) {
              const media = workbook.model.media.find((m: any) => m.rId === image.rId);
              if (media && media.buffer) {
                const bufferData = media.buffer;
                imageBuffer = Buffer.isBuffer(bufferData) ? bufferData : Buffer.from(bufferData);
                console.log('使用方式4获取图片缓冲区');
              }
            }
            // 方式5: 通过imageId在workbook中查找
            else if (typeof image.imageId === 'number' && workbook.model && workbook.model.media) {
              const media = workbook.model.media[image.imageId];
              if (media && media.buffer) {
                const bufferData = media.buffer;
                imageBuffer = Buffer.isBuffer(bufferData) ? bufferData : Buffer.from(bufferData);
                console.log('使用方式5获取图片缓冲区');
              }
            }
            // 方式6: 尝试直接从workbook.model.media中获取
            else if (workbook.model && workbook.model.media && workbook.model.media.length > 0) {
              // 尝试第一张图片
              const media = workbook.model.media[0];
              if (media && media.buffer) {
                const bufferData = media.buffer;
                imageBuffer = Buffer.isBuffer(bufferData) ? bufferData : Buffer.from(bufferData);
                console.log('使用方式6获取图片缓冲区');
              }
            }
            
            if (imageBuffer) {
              console.log(`图片缓冲区大小: ${imageBuffer.length} 字节`);
              
              // 生成唯一的图片文件名
              const imageId = `image_${Date.now()}_${i}`;
              const imageExt = this.getImageExtension(imageBuffer);
              const imageFileName = `${imageId}${imageExt}`;
              const imagePath = path.join(imagesDir, imageFileName);
              
              // 保存图片到文件系统
              fs.writeFileSync(imagePath, imageBuffer);
              console.log(`图片保存成功: ${imagePath}`);
              
              // 存储图片ID和路径的映射
              const imageUrl = `${this.serverUrl}/uploads/images/${imageFileName}`;
              imageMap[imageId] = imageUrl;
              
              // 同时存储一个默认映射，用于DISPIMG函数
              if (i === 0) {
                imageMap['default'] = imageUrl;
              }
              
              console.log(`图片URL: ${imageUrl}`);
            } else {
              console.log('无法获取图片缓冲区，尝试其他方式...');
              console.log('图片对象完整结构:', JSON.stringify(image));
            }
          } catch (error) {
            console.error(`处理图片 ${i+1} 失败:`, error);
          }
        }
      }
      
      console.log(`ExcelJS 图片提取完成，共提取 ${Object.keys(imageMap).length} 张图片`);
    } catch (error) {
      console.error('使用 ExcelJS 提取图片失败:', error);
    }
    
    return imageMap;
  }

  // 使用 JSZip 直接解压 Excel 文件，从 xl/media 目录提取图片
  private async extractImagesWithJSZip(filePath: string, outputDir: string): Promise<{ imageCells: any[], imageMap: Map<string, string> }> {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const imageMap = new Map<string, string>();
    const imageCells: any[] = [];
    
    try {
      // 1. 读取 Excel 文件为 Buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // 2. 使用 JSZip 加载文件
      const zip = await JSZip.loadAsync(fileBuffer);
      
      console.log('开始解压 Excel 文件...');
      
      // 3. 查找 xl/media 目录中的图片文件
      const mediaPath = 'xl/media/';
      const mediaFolder = zip.folder(mediaPath);
      
      if (!mediaFolder) {
        console.log('未找到 xl/media 目录');
        return { imageCells, imageMap };
      }
      
      // 4. 遍历 media 目录中的所有文件
      const mediaFiles: string[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (relativePath.startsWith(mediaPath) && !zipEntry.dir) {
          mediaFiles.push(relativePath);
        }
      });
      
      console.log(`找到 ${mediaFiles.length} 个图片文件`);
      
      // 5. 提取每个图片文件
      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaPath = mediaFiles[i];
        const fileName = path.basename(mediaPath);
        const fileExt = path.extname(fileName);
        
        try {
          // 读取文件内容
          const fileContent = await zip.file(mediaPath)?.async('nodebuffer');
          
          if (fileContent) {
            // 生成新的文件名
            const newFileName = `media_${i + 1}${fileExt}`;
            const outputPath = path.join(outputDir, newFileName);
            
            // 保存图片
            fs.writeFileSync(outputPath, fileContent);
            console.log(`已保存图片: ${newFileName} (原始文件名: ${fileName})`);
            
            // 创建多种映射方式，确保 DISPIMG 函数能找到图片
            
            // 映射1: 使用原始文件名（不带扩展名）
            const baseName = path.parse(fileName).name;
            imageMap.set(baseName, newFileName);
            
            // 映射2: 使用 "Picture N" 格式（DISPIMG 常用格式）
            imageMap.set(`Picture ${i + 1}`, newFileName);
            
            // 映射3: 使用索引格式
            imageMap.set(`${i + 1}`, newFileName);
            
            // 映射4: 使用 ID 格式（8位数字）
            const paddedId = String(i + 1).padStart(8, '0');
            imageMap.set(`ID_${paddedId}`, newFileName);
            
            // 映射5: 使用完整文件名
            imageMap.set(fileName, newFileName);
            
            console.log(`创建映射: ${baseName}, Picture ${i + 1}, ${i + 1}, ID_${paddedId}, ${fileName} -> ${newFileName}`);
          }
        } catch (error) {
          console.error(`提取图片 ${mediaPath} 失败:`, error);
        }
      }
      
      // 6. 尝试解析 xl/drawings 目录中的关系文件，建立图片与单元格的映射
      try {
        const drawingsPath = 'xl/drawings/';
        const drawingFiles: string[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (relativePath.startsWith(drawingsPath) && relativePath.endsWith('.xml') && !zipEntry.dir) {
            drawingFiles.push(relativePath);
          }
        });
        
        console.log(`找到 ${drawingFiles.length} 个 drawing 文件`);
        
        for (const drawingFile of drawingFiles) {
          try {
            const drawingContent = await zip.file(drawingFile)?.async('string');
            if (drawingContent) {
              // 解析 drawing XML，查找图片引用
              // 这里可以根据实际 XML 结构进行解析
              console.log(`解析 drawing 文件: ${drawingFile}`);
            }
          } catch (error) {
            console.error(`解析 drawing 文件 ${drawingFile} 失败:`, error);
          }
        }
      } catch (error) {
        console.error('解析 drawings 目录失败:', error);
      }
      
      console.log(`JSZip 提取完成，共提取 ${imageMap.size} 个图片映射`);
      
    } catch (error) {
      console.error('JSZip 提取图片失败:', error);
      throw error;
    }
    
    return { imageCells, imageMap };
  }

  // 使用 xlsx-populate 提取 DISPIMG 类型的图片
  private async extractDISPIMGImages(filePath: string, outputDir: string): Promise<{ imageCells: any[], imageMap: Map<string, string> }> {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 1. 加载工作簿
    const workbook = await XlsxPopulate.fromFileAsync(filePath);
    
    // 2. 遍历所有单元格，查找 DISPIMG 公式
    const imageCells = [];
    
    workbook.sheets().forEach((sheet) => {
      console.log(`检查工作表: ${sheet.name()}`);
      
      // 获取工作表中的所有图片
      const drawings = sheet.drawings();
      console.log(`工作表 ${sheet.name()} 有 ${drawings.length} 个 drawings`);
      
      // 获取所有单元格
      const usedRange = sheet.usedRange();
      if (usedRange) {
        usedRange.forEach((row) => {
          row.forEach((cell) => {
            const formula = cell.formula();
            if (formula && formula.includes('DISPIMG')) {
              console.log(`找到 DISPIMG 公式: 单元格 ${cell.address()} = ${formula}`);
              
              // 解析 DISPIMG 公式获取图片ID
              const match = formula.match(/DISPIMG\s*\(\s*"([^"]+)"\s*,\s*(\d+)\s*\)/);
              if (match) {
                const imageName = match[1];  // 图片名称，如 "Picture 1"
                const displayType = match[2]; // 显示类型
                
                imageCells.push({
                  sheet: sheet.name(),
                  cell: cell.address(),
                  imageName,
                  displayType,
                  value: cell.value(),
                  formula: formula
                });
              }
            }
          });
        });
      }
    });
    
    console.log(`找到 ${imageCells.length} 个包含 DISPIMG 公式的单元格`);
    
    // 3. 尝试提取图片
    const imageMap = new Map<string, string>();
    let imageCounter = 1;
    
    // 从 drawings 中提取
    workbook.sheets().forEach((sheet) => {
      const drawings = sheet.drawings();
      drawings.forEach((drawing, index) => {
        try {
          // 获取图片数据
          const image = drawing.image();
          if (image && image.buffer) {
            const imageBuffer = image.buffer();
            if (imageBuffer && imageBuffer.length > 0) {
              // 生成文件名
              const fileName = `dispimg_${sheet.name()}_${index}.png`;
              const filePath = path.join(outputDir, fileName);
              
              // 保存图片
              fs.writeFileSync(filePath, imageBuffer);
              console.log(`已保存 DISPIMG 图片: ${fileName}`);
              
              // 映射图片名称
              const imageName = `Picture ${index + 1}`;
              imageMap.set(imageName, fileName);
              
              // 同时映射 ID 格式的图片名称
              const idMatch = fileName.match(/dispimg_.+_(\d+)\.png/);
              if (idMatch) {
                const id = `ID_${idMatch[1].padStart(8, '0')}`;
                imageMap.set(id, fileName);
              }
            }
          }
        } catch (error) {
          console.log(`无法提取 drawing ${index}:`, error.message);
        }
      });
    });
    
    return { imageCells, imageMap };
  }

  // 根据图片缓冲区获取图片扩展名
  private getImageExtension(buffer: Buffer): string {
    // 检查图片文件头
    const header = buffer.toString('hex', 0, 8);
    
    if (header.startsWith('89504e47')) return '.png';
    if (header.startsWith('ffd8ffe0') || header.startsWith('ffd8ffe1') || header.startsWith('ffd8ffe2')) return '.jpg';
    if (header.startsWith('47494638')) return '.gif';
    if (header.startsWith('424d')) return '.bmp';
    
    return '.bin'; // 默认扩展名
  }

  // 处理Excel数据，解析DISPIMG函数
  private async processExcelData(data: any[], imageMap: Record<string, string>, imagesDir: string): Promise<any[]> {
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
    
    console.log('开始处理Excel数据...');
    console.log(`Excel数据行数: ${data.length}`);
    console.log(`提取的图片数量: ${Object.keys(imageMap).length}`);
    console.log(`表头映射:`, JSON.stringify(headerMap));
    console.log(`数据处理范围: 从第${startDataIndex+1}行到第${endDataIndex+1}行`);
    
    // 图片计数器，用于为每个DISPIMG生成唯一的图片引用
    let imageCounter = 0;
    
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
            console.log(`找到DISPIMG图片ID: ${imgId}`);
            
            // 检查是否有对应的图片
            if (Object.keys(imageMap).length > 0) {
              // 如果有提取到的图片，使用循环分配
              const imageIndex = imageCounter % Object.keys(imageMap).length;
              const imagePath = Object.values(imageMap)[imageIndex];
              processedItem.avatar = imagePath.trim().replace(/`/g, '');
              console.log(`使用图片: ${processedItem.avatar}`);
              imageCounter++;
            } else {
              // 如果没有提取到图片，使用占位符
              processedItem.avatar = `https://picsum.photos/200/200?v=${imgId}`;
              console.log('没有提取到图片，使用占位符');
            }
          }
        }
      }
      
      // 确保avatar字段格式正确
      if (processedItem.avatar) {
        processedItem.avatar = processedItem.avatar.trim().replace(/`/g, '');
      }
      
      // 只添加有实际数据的项目
      if (Object.keys(processedItem).length > 0) {
        processedData.push(processedItem);
        console.log(`处理完成第${i+1}行数据:`, JSON.stringify(processedItem, (key, value) => {
          if (key === 'avatar') return value;
          return undefined;
        }));
      }
    }
    
    console.log(`数据处理完成，成功处理: ${processedData.length} 条`);
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
