import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Permissions } from 'src/common/decorators';
import { CategoryPermissions } from './permissions/category.permissions';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Permissions(CategoryPermissions.PERMISSIONS.CATEGORY_CREATE)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Permissions(CategoryPermissions.PERMISSIONS.CATEGORY_READ)
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Permissions(CategoryPermissions.PERMISSIONS.CATEGORY_READ)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Permissions(CategoryPermissions.PERMISSIONS.CATEGORY_UPDATE)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Permissions(CategoryPermissions.PERMISSIONS.CATEGORY_DELETE)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
