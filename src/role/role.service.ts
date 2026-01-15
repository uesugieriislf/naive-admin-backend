import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(query: any) {
    const { page = 1, pageSize = 10, name } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (name) {
      queryBuilder.andWhere('role.name LIKE :name', { name: `%${name}%` });
    }

    const [list, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('role.create_date', 'DESC')
      .getManyAndCount();

    return {
      page: Number(page),
      pageSize: Number(pageSize),
      pageCount: Math.ceil(total / pageSize),
      itemCount: total,
      list,
    };
  }

  async findOne(id: number) {
    return await this.roleRepository.findOne({
      where: { id },
      relations: ['menus'],
    });
  }

  async create(roleData: Partial<Role>) {
    const role = this.roleRepository.create(roleData);
    return await this.roleRepository.save(role);
  }

  async update(id: number, roleData: Partial<Role>) {
    await this.roleRepository.update(id, roleData);
    return await this.findOne(id);
  }

  async delete(id: number) {
    return await this.roleRepository.delete(id);
  }

  async findByName(name: string) {
    return await this.roleRepository.findOne({ where: { name } });
  }
}
