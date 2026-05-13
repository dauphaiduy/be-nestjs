import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueries } from 'src/common/shared/queries';
import { CategoryRepository } from 'src/common/shared/repositories';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryQueries: CategoryQueries,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  create(createCategoryDto: CreateCategoryDto) {
    return this.categoryRepository.create({ data: createCategoryDto });
  }

  findAll() {
    return this.categoryQueries.find();
  }

  async findOne(id: number) {
    const category = await this.categoryQueries.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.categoryRepository.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.categoryRepository.delete({ where: { id } });
  }
}
