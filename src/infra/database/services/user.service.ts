import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../models/user.model';
import { Model } from 'mongoose';

export interface UserDataType {
  userId: string;
  name?: string;
  status?: string;
  threadId: string;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(user: UserDataType) {
    const newUser = new this.userModel(user);
    return await newUser.save();
  }

  async findByUserId(userId: string){
    return await this.userModel.findOne({ userId }).exec()
  }
}
