import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { ApiBody, ApiParam, ApiProperty, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { MessageProcessorUseCase } from "src/use-case/message-processor/message-processor.service";
import zod from "zod";

export class RequestProcessBody {
  @ApiProperty()
  message: string;

  @ApiProperty()
  userId: string;
}

@ApiTags("Message")
@Controller("message")
export class MessageController {
  constructor(private messageUseCase: MessageProcessorUseCase) {}

  @ApiBody({ type: RequestProcessBody })
  @Post("/process")
  async processMessage(@Body() body: RequestProcessBody, @Res() res: Response) {
    console.log("BODY ---->", body);

    const schema = zod.object({
      contactName: zod.string().optional().nullable(),
      messages: zod.array(zod.string()),
      userId: zod.string(),
    });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors;

      const renderErrors = errors.map((error) => {
        return { field: error.path.join(", "), message: error.message };
      });

      console.log(renderErrors);

      return res.status(400).json({
        message: `body validation error`,
        errors: renderErrors,
      });
    }

    const { message, finished } = await this.messageUseCase.process(
      validationResult.data.userId,
      validationResult.data.messages,
      validationResult.data.contactName
    );
    console.log("RESPONSE -->", message);
    return res.send({ message, finished });
  }

  @ApiParam({
    name: "id",
    required: true,
    description: "The ID of the message",
  })
  @Get("/is-finished/:userId")
  async isFinished(@Param("userId") userId: string) {
    const user = await this.messageUseCase.getSession(userId);

    console.log(user,userId)

    if (!user) {
      return { isFinished: false };
    }

    return { isFinished: user?.finished };
  }
}
