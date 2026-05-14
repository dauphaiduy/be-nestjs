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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CurrentUser } from 'src/common/decorators';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: { sub: number }) {
    return this.cartService.getCart(user.sub);
  }

  @Post('items')
  addItem(@CurrentUser() user: { sub: number }, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: { sub: number },
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, productId, dto);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: { sub: number },
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeItem(user.sub, productId);
  }

  @Delete()
  clearCart(@CurrentUser() user: { sub: number }) {
    return this.cartService.clearCart(user.sub);
  }
}
