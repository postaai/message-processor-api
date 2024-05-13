import { Module } from "@nestjs/common";
import { OpenAiModule } from "./config/openaiclient/openai.module";
import { MessageController } from "./controller/message.controller";
import { MessageProcessorUseCase } from "./use-case/message-processor/message-processor.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserService } from "./infra/database/services/user.service";
import { User, UserSchema } from "./infra/database/models/user.model";
import { Imovel, ImovelSchema } from "./infra/database/models/imoveis.model";
import { ImoveisService } from "./infra/database/services/imoveis.service";
import { SessionController } from "./controller/session.controller";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, {name: Imovel.name, schema: ImovelSchema}]),
    OpenAiModule.forRoot(),
  ],
  controllers: [MessageController,SessionController],
  providers: [MessageProcessorUseCase,UserService,ImoveisService],
})
export class AppModule {}
