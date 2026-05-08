import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RoleQueries } from 'src/common/shared/queries';
import { RoleRepository } from 'src/common/shared/repositories';

describe('RolesService', () => {
  let service: RolesService;
  let roleQueries: { find: jest.Mock; findUnique: jest.Mock; count: jest.Mock };
  let roleRepository: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    roleQueries = { find: jest.fn(), findUnique: jest.fn(), count: jest.fn() };
    roleRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RoleQueries, useValue: roleQueries },
        { provide: RoleRepository, useValue: roleRepository },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('create', () => {
    it('delegates to repository and returns created role', async () => {
      roleRepository.create.mockResolvedValue({ id: 1, name: 'admin' });

      const result = await service.create({
        name: 'admin',
        permissions: ['*'],
      });

      expect(result).toEqual({ id: 1, name: 'admin' });
      expect(roleRepository.create).toHaveBeenCalledWith({
        data: { name: 'admin', permissions: ['*'] },
      });
    });
  });

  describe('findAll', () => {
    it('returns all roles', async () => {
      roleQueries.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns role when found', async () => {
      roleQueries.findUnique.mockResolvedValue({ id: 1, name: 'admin' });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, name: 'admin' });
      expect(roleQueries.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws NotFoundException when role does not exist', async () => {
      roleQueries.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99)).rejects.toThrow('Role #99 not found');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when role does not exist', async () => {
      roleQueries.findUnique.mockResolvedValue(null);
      await expect(service.update(99, { name: 'new' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates role when it exists', async () => {
      roleQueries.findUnique.mockResolvedValue({ id: 1, name: 'admin' });
      roleRepository.update.mockResolvedValue({ id: 1, name: 'super-admin' });

      const result = await service.update(1, { name: 'super-admin' });

      expect(result).toEqual({ id: 1, name: 'super-admin' });
      expect(roleRepository.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'super-admin' },
      });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when role does not exist', async () => {
      roleQueries.findUnique.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('deletes role when it exists', async () => {
      roleQueries.findUnique.mockResolvedValue({ id: 1, name: 'admin' });
      roleRepository.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(roleRepository.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
