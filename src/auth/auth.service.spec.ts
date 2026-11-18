import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService.signAsync.mockResolvedValue('signed-token');
  });

  it('hashes the password and returns a token without exposing the hash', async () => {
    const user = {
      _id: new Types.ObjectId(),
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: 'stored-hash',
    };
    usersService.create.mockResolvedValue(user);

    const result = await service.register({
      name: ' Ada ',
      email: ' ADA@EXAMPLE.COM ',
      password: 'strong-pass-123',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      { name: 'Ada', email: 'ada@example.com' },
      expect.any(String),
    );
    const passwordHash = usersService.create.mock.calls[0][1] as string;
    expect(passwordHash).not.toBe('strong-pass-123');
    await expect(bcrypt.compare('strong-pass-123', passwordHash)).resolves.toBe(
      true,
    );
    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: user._id.toString(),
        name: 'Ada',
        email: 'ada@example.com',
      },
    });
  });

  it('authenticates with the stored hash', async () => {
    const user = {
      _id: new Types.ObjectId(),
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: await bcrypt.hash('strong-pass-123', 4),
    };
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.login({ email: user.email, password: 'strong-pass-123' }),
    ).resolves.toMatchObject({ access_token: 'signed-token' });
  });

  it('uses the same unauthorized response for unknown users and wrong passwords', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'wrong-pass' }),
    ).rejects.toThrow('Invalid email or password');

    usersService.findByEmail.mockResolvedValue({
      _id: new Types.ObjectId(),
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: await bcrypt.hash('real-password', 4),
    });
    await expect(
      service.login({ email: 'ada@example.com', password: 'wrong-pass' }),
    ).rejects.toThrow('Invalid email or password');
  });
});
