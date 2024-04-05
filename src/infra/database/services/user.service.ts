import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';

interface UserDataType {
  userId: string;
  name?: string;
  status?: string;
  threadId: string;
}

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(user: UserDataType) {
    return await this.userRepository.createUser(user);
  }

  async findByUserId(userId: string) {
    return await this.userRepository.findUser(userId);
  }
}
