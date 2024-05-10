import { Body, Controller, Post, Res } from "@nestjs/common";
import { ApiBody, ApiProperty } from "@nestjs/swagger";
import { Response } from "express";
import { MessageProcessorUseCase } from "src/use-case/message-processor/message-processor.service";
import zod from "zod";

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
  async processMessage(@Body() body: RequestProcessBody, @Res() res: Response) {
    console.log("BODY ---->", body);

    // ...

    const schema = zod.object({
      message: zod.string(),
      userId: zod.string(),
      assistantId: zod.string(),
    });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      // Handle validation errors

      const errors = validationResult.error.errors;

      const renderError = errors.map((error) => {
        return `field: ${error.path.join(", ")}: ${error.message}`;
      }).join("\n")

      console.log(renderError);

      return res.status(400).json({
        message: `body validation error: ${renderError}`,
      });
    }

    const message = await this.messageUseCase.process(
      validationResult.data.userId,
      validationResult.data.message,
      validationResult.data.assistantId
    );
    console.log("RESPONSE -->", message);
    return { message };
  }
}
