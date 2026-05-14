import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentUser } from 'src/common/decorators';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UserType } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: { sub: number }) {
    return this.orderService.checkout(user.sub);
  }

  @Get()
  findAll(
    @CurrentUser() user: { sub: number; userType: UserType },
    @Query() query: QueryOrderDto,
  ) {
    return this.orderService.findAll(user.sub, user.userType, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { sub: number; userType: UserType },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.findOne(id, user.sub, user.userType);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: { sub: number; userType: UserType },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto, user.sub, user.userType);
  }
}
