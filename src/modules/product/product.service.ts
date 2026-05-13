import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductQueries } from 'src/common/shared/queries';
import { ProductRepository } from 'src/common/shared/repositories';

@Injectable()
export class ProductService {
  constructor(
    private readonly productQueries: ProductQueries,
    private readonly productRepository: ProductRepository,
  ) {}

  create(createProductDto: CreateProductDto) {
    return this.productRepository.create({ data: createProductDto });
  }

  async findAll(query: QueryProductDto) {
    const { page = 1, limit = 10, name, status, categoryId } = query;
    const where: Prisma.ProductWhereInput = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(status && { status }),
      ...(categoryId !== undefined && { categoryId }),
    };

    const [items, total] = await Promise.all([
      this.productQueries.find({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      this.productQueries.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const product = await this.productQueries.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    return this.productRepository.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.productRepository.delete({ where: { id } });
  }
}
