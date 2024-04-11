import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiProperty } from "@nestjs/swagger";
import { MessageProcessorUseCase } from "src/use-case/message-processor/message-processor.service";

export class RequestProcessBody {
  @ApiProperty()
  message: string;

  @ApiProperty()
  userId: string;
}

@Controller("message")
export class MessageController {
  constructor(private messageUseCase: MessageProcessorUseCase) {}

  @ApiBody({ type: RequestProcessBody })
  @Post("/process")
  async processMessage(@Body() body: RequestProcessBody) {
    console.log(body);
    const response = await this.messageUseCase.process(body.userId, body.message);
    console.log(response);
    return response;
  }
  
}
