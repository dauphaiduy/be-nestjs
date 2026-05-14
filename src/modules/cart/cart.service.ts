import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma';
import { CartQueries } from 'src/common/shared/queries';
import { CartRepository } from 'src/common/shared/repositories';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartQueries: CartQueries,
    private readonly cartRepository: CartRepository,
  ) {}

  async getCart(userId: number) {
    return this.findOrCreateCart(userId);
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const { productId, quantity } = dto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product #${productId}`,
      );
    }

    const cart = await this.findOrCreateCart(userId);

    return this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
      include: { product: true },
    });
  }

  async updateItem(userId: number, productId: number, dto: UpdateCartItemDto) {
    const cart = await this.getActiveCart(userId);

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException(`Item not found in cart`);
    }

    if (item.product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for product #${productId}`,
      );
    }

    return this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: number, productId: number) {
    const cart = await this.getActiveCart(userId);

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (!item) {
      throw new NotFoundException(`Item not found in cart`);
    }

    return this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
  }

  async clearCart(userId: number) {
    const cart = await this.getActiveCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: 'Cart cleared' };
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────────

  async findOrCreateCart(userId: number) {
    const existing = await this.cartQueries.findOne({
      where: { userId, status: 'ACTIVE' },
      include: { items: { include: { product: true } } },
    });

    if (existing) return existing;

    return this.cartRepository.create({
      data: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async getActiveCart(userId: number) {
    const cart = await this.cartQueries.findOne({
      where: { userId, status: 'ACTIVE' },
    });

    if (!cart) {
      throw new NotFoundException('No active cart found');
    }

    return cart;
  }
}
