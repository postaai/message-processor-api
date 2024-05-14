import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import {
  ApiBody,
  ApiHeader,
  ApiParam,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { MessageProcessorUseCase } from "src/use-case/message-processor/message-processor.service";
import zod from "zod";

class RequestCreateSessionBody {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  assistantId: string;
}

@ApiTags("Session")
@Controller("session")
export class SessionController {
  constructor(private messageUseCase: MessageProcessorUseCase) {}

  @ApiBody({ type: RequestCreateSessionBody })
  @Post()
  async createSession(
    @Body() body: RequestCreateSessionBody,
    @Res() res: Response
  ) {
    const schema = zod.object({
      userId: zod.string(),
      assistantId: zod.string(),
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

    await this.messageUseCase.createUser(
      validationResult.data.userId,
      validationResult.data.assistantId
    );

    console.log("Session created", validationResult.data.userId);

    return res.status(201).send();
  }

  @ApiHeader({ name: "userId", required: true })
  @Delete("/clear")
  async processMessage(@Headers() headers, @Res() res: Response) {
    const userId = headers?.userid;

    if (!userId) {
      return res.status(400).json({
        message: `userId is required`,
      });
    }

    await this.messageUseCase.clearSession(userId);

    console.log("Session deleted", userId);

    return res.send({ ok: true });
  }

  @ApiHeader({ name: "userId", required: true })
  @Get()
  async get(@Headers() headers, @Res() res: Response) {
    const userId = headers?.userid;

    console.log("getSession -> userId =>", userId);

    if (!userId) {
      return res.status(400).json({
        message: `userId is required`,
      });
    }

    const session = await this.messageUseCase.getSession(userId);

    console.log(session);
    if (!session) return res.status(404).send({ message: "Session not found" });

    return res.send(session);
  }
}
