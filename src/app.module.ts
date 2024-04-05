import { Module } from "@nestjs/common";
import { OpenAiModule } from "./config/openaiclient/openai.module";
import { MessageController } from "./controller/message.controller";
import { MessageProcessorUseCase } from "./use-case/message-processor/message-processor.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserService } from "./infra/database/services/user.service";
import { User, UserSchema } from "./infra/database/models/user.model";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OpenAiModule.forRoot(),
  ],
  controllers: [MessageController],
  providers: [MessageProcessorUseCase,UserService],
})
export class AppModule {}
