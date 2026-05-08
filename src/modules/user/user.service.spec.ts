import { Test, TestingModule } from '@nestjs/testing';
import { AccountType } from '@prisma/client';
import { UserQueries } from 'src/common/shared/queries';
import { UserRepository } from 'src/common/shared/repositories';
import { UserService } from './user.service';

jest.mock('src/common/utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

import { hashPassword } from 'src/common/utils';

describe('UserService', () => {
  let service: UserService;
  let userQueries: { findOne: jest.Mock; find: jest.Mock; count: jest.Mock };
  let userRepository: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    userQueries = { findOne: jest.fn(), find: jest.fn(), count: jest.fn() };
    userRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserQueries, useValue: userQueries },
        { provide: UserRepository, useValue: userRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('hashes password and creates a LOCAL user', async () => {
      userRepository.create.mockResolvedValue({ id: 1, username: 'bob' });
      (hashPassword as jest.Mock).mockResolvedValue('hashed-password');

      await service.create({
        username: 'bob',
        email: 'b@b.com',
        password: 'plain',
        roleId: 1,
        accountType: AccountType.LOCAL,
      });

      expect(hashPassword).toHaveBeenCalledWith('plain');
      expect(userRepository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ password: 'hashed-password' }),
      });
    });

    it('throws when LOCAL account has no password', async () => {
      await expect(
        service.create({
          username: 'bob',
          email: 'b@b.com',
          accountType: AccountType.LOCAL,
          roleId: 1,
        }),
      ).rejects.toThrow('Password is required for local accounts');
    });

    it('creates GOOGLE account without a password', async () => {
      userRepository.create.mockResolvedValue({ id: 2, username: 'guser' });

      await service.create({
        username: 'guser',
        email: 'g@g.com',
        roleId: 1,
        accountType: AccountType.GOOGLE,
      });

      expect(userRepository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ password: undefined }),
      });
    });
  });

  describe('findAll', () => {
    it('returns paginated result with totals', async () => {
      userQueries.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      userQueries.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('applies case-insensitive email filter', async () => {
      userQueries.find.mockResolvedValue([]);
      userQueries.count.mockResolvedValue(0);

      await service.findAll({
        email: 'test',
        page: 1,
        limit: 10,
      });

      expect(userQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: { contains: 'test', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('applies isActive filter', async () => {
      userQueries.find.mockResolvedValue([]);
      userQueries.count.mockResolvedValue(0);

      await service.findAll({
        isActive: true,
        page: 1,
        limit: 10,
      });

      expect(userQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('uses correct skip for pagination', async () => {
      userQueries.find.mockResolvedValue([]);
      userQueries.count.mockResolvedValue(0);

      await service.findAll({ page: 3, limit: 5 });

      expect(userQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('delegates to userQueries with username', () => {
      userQueries.findOne.mockResolvedValue({ id: 1 });
      service.findOne('bob');
      expect(userQueries.findOne).toHaveBeenCalledWith({
        where: { username: 'bob' },
      });
    });
  });

  describe('update', () => {
    it('delegates to userRepository', () => {
      userRepository.update.mockResolvedValue({ id: 1, name: 'Alice' });
      service.update(1, { name: 'Alice' });
      expect(userRepository.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Alice' },
      });
    });
  });

  describe('remove', () => {
    it('delegates to userRepository', () => {
      userRepository.delete.mockResolvedValue({ id: 1 });
      service.remove(1);
      expect(userRepository.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
