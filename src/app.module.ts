import { Module } from '@nestjs/common';
import { OpenAiModule } from './config/openaiclient/openai.module';
import { MessageController } from './controller/message.controller';
import { MessageProcessorUseCase } from './use-case/message-processor/message-processor.service';
import { DataBaseModule } from './infra/database/database.module';
import { UserRepository } from './infra/database/repository/user.repository';
import { UserService } from './infra/database/services/user.service';

@Module({
  imports: [DataBaseModule, OpenAiModule.forRoot()],
  controllers: [MessageController],
  providers: [MessageProcessorUseCase, UserService],
})
export class AppModule {}
