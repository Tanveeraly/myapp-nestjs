import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const userModel = {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a user in MongoDB', async () => {
    const user = { name: 'Ada', email: 'ada@example.com' };
    const passwordHash = 'hashed-password';
    userModel.create.mockResolvedValue(user);

    await expect(service.create(user, passwordHash)).resolves.toBe(user);
    expect(userModel.create).toHaveBeenCalledWith({ ...user, passwordHash });
  });

  it('looks up email case-insensitively and selects the password hash', async () => {
    const user = { name: 'Ada', email: 'ada@example.com' };
    const query = {
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(user),
    };
    userModel.findOne.mockReturnValue(query);

    await expect(service.findByEmail(' ADA@EXAMPLE.COM ')).resolves.toBe(user);
    expect(userModel.findOne).toHaveBeenCalledWith({
      email: 'ada@example.com',
    });
    expect(query.select).toHaveBeenCalledWith('+passwordHash');
  });

  it('returns a conflict when the email is already registered', async () => {
    userModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.create({ name: 'Ada', email: 'ada@example.com' }, 'hash'),
    ).rejects.toThrow(ConflictException);
  });

  it('returns users from MongoDB', async () => {
    const users = [{ name: 'Ada', email: 'ada@example.com' }];
    userModel.find.mockReturnValue({ exec: vi.fn().mockResolvedValue(users) });

    await expect(service.findAll()).resolves.toBe(users);
  });

  it('rejects malformed ids before querying MongoDB', async () => {
    await expect(service.findOne('not-an-object-id')).rejects.toThrow(
      BadRequestException,
    );
    expect(userModel.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when an id does not match a user', async () => {
    userModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.findOne('507f1f77bcf86cd799439011'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates and deletes users by MongoDB id', async () => {
    const id = '507f1f77bcf86cd799439011';
    const user = { name: 'Ada', email: 'ada@example.com' };
    const updateDto = { name: 'Ada Lovelace' };
    userModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(user),
    });
    userModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(user),
    });

    await expect(service.update(id, updateDto)).resolves.toBe(user);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, {
      new: true,
      runValidators: true,
    });
    await expect(service.remove(id)).resolves.toBe(user);
    expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(id);
  });
});
