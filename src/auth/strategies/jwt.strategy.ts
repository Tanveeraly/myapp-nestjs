import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../jwt-secret.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      throw new UnauthorizedException('Invalid access token');
    }
    return { sub: payload.sub, email: payload.email };
  }
}
