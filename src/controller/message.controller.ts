import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiProperty } from "@nestjs/swagger";
import { MessageProcessorUseCase } from "src/use-case/message-processor/message-processor.service";

export class RequestProcessBody {
  @ApiProperty()
  message: string;
}

@Controller("message")
export class MessageController {
  constructor(private messageUseCase: MessageProcessorUseCase) {}

  @ApiBody({ type: RequestProcessBody })
  @Post("/process")
  async processMessage(@Body("message") message: string) {
    return await this.messageUseCase.processMessage("123", message);
  }
  
}
