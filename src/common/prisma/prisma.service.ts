import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { appStorage } from '../storage';
import { CommonHelpers } from '../helpers';

type ExtendedRequest = {
  scopeVariable?: { session?: { userId?: number } };
};

function getCurrentUserId(fallback: number): number {
  const req = appStorage.getStore()?.request as ExtendedRequest | undefined;
  return req?.scopeVariable?.session?.userId ?? fallback;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly defaultUserId = 0;

  constructor() {
    super();
  }

  async onModuleInit() {
    const defaultUserId = this.defaultUserId;
    await this.$connect();
    Object.assign(
      this,
      this.$extends({
        query: {
          $allModels: {
            async create({ model, args, query }) {
              const fields =
                Prisma.dmmf?.datamodel?.models
                  ?.find((m) => m.name === model)
                  ?.fields.map((d) => d.name) ?? [];

              if (fields.includes('createdBy') && args.data) {
                (args.data as Record<string, unknown>)['createdBy'] =
                  getCurrentUserId(defaultUserId);
              }

              return query(args);
            },
            async updateMany({ model, args, query }) {
              const fields =
                Prisma.dmmf?.datamodel?.models
                  ?.find((m) => m.name === model)
                  ?.fields.map((d) => d.name) ?? [];

              if (fields.includes('updatedBy') && args.data) {
                (args.data as Record<string, unknown>)['updatedBy'] =
                  getCurrentUserId(defaultUserId);
              }
              return query(args);
            },
            async update({ model, args, query }) {
              const fields =
                Prisma.dmmf?.datamodel?.models
                  ?.find((m) => m.name === model)
                  ?.fields.map((d) => d.name) ?? [];

              if (fields.includes('updatedBy') && args.data) {
                (args.data as Record<string, unknown>)['updatedBy'] =
                  getCurrentUserId(defaultUserId);
              }

              return query(args);
            },
            async upsert({ model, args, query }) {
              const fields =
                Prisma.dmmf?.datamodel?.models
                  ?.find((m) => m.name === model)
                  ?.fields.map((d) => d.name) ?? [];

              if (fields.includes('updatedBy') && args.update) {
                (args.update as Record<string, unknown>)['updatedBy'] =
                  getCurrentUserId(defaultUserId);
              }

              if (fields.includes('createdBy') && args.create) {
                (args.create as Record<string, unknown>)['createdBy'] =
                  getCurrentUserId(defaultUserId);
              }

              return query(args);
            },
          },
        },
        client: {
          async $queryRaw<T = unknown>(
            this: {
              $queryRawUnsafe(
                query: string,
                ...params: unknown[]
              ): Promise<unknown>;
            },
            query: Prisma.Sql,
            ...params: unknown[]
          ): Promise<T[]> {
            const rawData = (await this.$queryRawUnsafe(
              query.sql,
              ...params,
            )) as Record<string, unknown>[];
            return rawData.map((row) => CommonHelpers.toCamelCase(row)) as T[];
          },
        },
      }),
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
