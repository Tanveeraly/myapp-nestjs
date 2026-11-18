import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(
    userDetails: Pick<User, 'name' | 'email'>,
    passwordHash: string,
  ): Promise<UserDocument> {
    try {
      return await this.userModel.create({ ...userDetails, passwordHash });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    this.validateId(id);
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    this.validateId(id);
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    this.validateId(id);
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  private validateId(id: string): void {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid user id: ${id}`);
    }
  }
}
