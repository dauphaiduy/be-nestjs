import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, UserType } from '@prisma/client';
import { PrismaService } from 'src/common/prisma';
import { OrderQueries } from 'src/common/shared/queries';
import { OrderRepository } from 'src/common/shared/repositories';
import { CartService } from '../cart/cart.service';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

// Valid state transitions: from → allowed nexts
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderQueries: OrderQueries,
    private readonly orderRepository: OrderRepository,
    private readonly cartService: CartService,
  ) {}

  async checkout(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      throw new BadRequestException('No active cart found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify stock and reserve atomically
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for product "${item.product.name}"`,
          );
        }
      }

      // 2. Snapshot prices and create order
      const totalAmount = cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.product.price, // snapshot — never reference live price
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // 3. Mark cart as ordered
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'ORDERED' },
      });

      return order;
    });
  }

  async findAll(userId: number, userType: UserType, query: QueryOrderDto) {
    const { page = 1, limit = 10, status } = query;
    const isStaff = userType === UserType.ADMIN || userType === UserType.STAFF;

    const where = {
      ...(isStaff ? {} : { userId }), // customers see only their own
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      this.orderQueries.find({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.orderQueries.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number, userId: number, userType: UserType) {
    const order = await this.orderQueries.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    const isStaff = userType === UserType.ADMIN || userType === UserType.STAFF;

    if (!isStaff && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    userId: number,
    userType: UserType,
  ) {
    const order = await this.findOne(id, userId, userType);
    const isStaff = userType === UserType.ADMIN || userType === UserType.STAFF;

    if (!isStaff) {
      // Customers can only cancel their own PENDING orders
      if (dto.status !== OrderStatus.CANCELLED) {
        throw new ForbiddenException('Customers can only cancel orders');
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Only PENDING orders can be cancelled by customers',
        );
      }
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? [];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    // If cancelling, restore stock and cancel any active payment transactions
    if (dto.status === OrderStatus.CANCELLED) {
      return this.prisma.$transaction(async (tx) => {
        const fullOrder = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });

        for (const item of fullOrder!.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Cancel any PENDING or PROCESSING payment transactions for this order
        await tx.paymentTransaction.updateMany({
          where: {
            orderId: id,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
          data: { status: 'CANCELLED' },
        });

        return tx.order.update({
          where: { id },
          data: { status: dto.status },
          include: { items: { include: { product: true } } },
        });
      });
    }

    return this.orderRepository.update({
      where: { id },
      data: { status: dto.status },
      include: { items: { include: { product: true } } },
    });
  }

  // Called by the scheduler — releases stock from stale PENDING orders
  async releaseAbandonedOrders() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago

    const staleOrders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING, createdAt: { lt: cutoff } },
      include: { items: true },
    });

    for (const order of staleOrders) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Cancel any PENDING or PROCESSING payment transactions for this order
        await tx.paymentTransaction.updateMany({
          where: {
            orderId: order.id,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
          data: { status: 'CANCELLED' },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
      });
    }
  }
}
