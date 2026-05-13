import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Permissions } from 'src/common/decorators';
import { ProductPermissions } from './permissions/product.permissions';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_CREATE)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_READ)
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_READ)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_UPDATE)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Permissions(ProductPermissions.PERMISSIONS.PRODUCT_DELETE)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
