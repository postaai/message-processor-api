import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../models/user.model';
import { Model } from 'mongoose';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(user) {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async findUser(userId: string) {
    return this.userModel.findOne({ userId });
  }
}
