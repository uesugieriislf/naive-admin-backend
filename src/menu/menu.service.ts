import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async findAll() {
    const menus = await this.menuRepository.find({
      order: { sort: 'ASC' },
    });
    return { list: menus };
  }

  async findTree() {
    const menus = await this.menuRepository.find({
      order: { sort: 'ASC' },
    });
    return { list: this.buildMenuTree(menus) };
  }

  async findOne(id: number) {
    return await this.menuRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async create(menuData: Partial<Menu>) {
    const menu = this.menuRepository.create(menuData);
    return await this.menuRepository.save(menu);
  }

  async update(id: number, menuData: Partial<Menu>) {
    await this.menuRepository.update(id, menuData);
    return await this.findOne(id);
  }

  async delete(id: number) {
    return await this.menuRepository.delete(id);
  }

  async findByKeys(keys: string[]) {
    return await this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.key IN (:...keys)', { keys })
      .getMany();
  }

  async findByRole(roleId: number) {
    const menus = await this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .getMany();
    return menus;
  }

  private buildMenuTree(menus: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    menus.forEach(menu => {
      map.set(menu.id, { ...menu, children: [] });
    });

    menus.forEach(menu => {
      if (menu.parentId) {
        const parent = map.get(menu.parentId);
        if (parent) {
          parent.children.push(map.get(menu.id));
        }
      } else {
        roots.push(map.get(menu.id));
      }
    });

    return roots;
  }
}
