import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create(
      {
        name: registerDto.name.trim(),
        email: registerDto.email.trim().toLowerCase(),
      },
      passwordHash,
    );
    return this.createAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (
      !user ||
      typeof user.passwordHash !== 'string' ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: UserDocument) {
    const id = user._id.toString();
    const payload: JwtPayload = { sub: id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
