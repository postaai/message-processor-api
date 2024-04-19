import { HttpException, Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { TextContentBlock } from "openai/resources/beta/threads/messages/messages";
import { delay } from "src/utils/delay";
import { OpenAiClient } from "src/config/openaiclient/openai-client";
import { UserService } from "src/infra/database/services/user.service";
import { User } from "src/infra/database/models/user.model";
import { Run } from "openai/resources/beta/threads/runs/runs";
import e from "express";

const assistantID = "asst_sVmJSAWXTV7Cdkn495cQaMO7";

@Injectable()
export class MessageProcessorUseCase {
  private clinet: OpenAI;
  constructor(
    private openAiClient: OpenAiClient,
    private userService: UserService
  ) {
    this.clinet = this.openAiClient.getClient();
  }

  async process(userId: string, message: string) {
    let user = await this.userService.findByUserId(userId);
    if (!user) {
      const newThread = await this.clinet.beta.threads.create();
      user = await this.userService.create({
        userId,
        threadId: newThread.id,
      });
    }
    console.log("usuario criado :", user);
    return await this.processMessage(user, message);
  }

  private async processMessage(user: User, message: string) {
    try {
      console.log("Mensagem enviada para OpenAI");
      await this.clinet.beta.threads.messages.create(user.threadId, {
        content: message,
        role: "user",
      });

      console.log("Thread ID: ", user.threadId);
    } catch (err) {
      throw new HttpException("Error to send message to OpenAI", 400);
    }

    console.log("Criando run");
    const run = await this.clinet.beta.threads.runs.create(user.threadId, {
      assistant_id: assistantID,
    });

    if ((await this.checkStatus(run, user)) === "completed") {
      const listMessage = await this.listMessages(user.threadId, 0);
      console.log("Mensagens listadas: ", listMessage);
      return listMessage;
    }
  }

  private async checkStatus(run: Run, user: User) {
    let retrieveRun: Run;

    try {
      await delay(1000);

      console.log("Verificando status");
      retrieveRun = await this.clinet.beta.threads.runs.retrieve(
        user.threadId,
        run.id
      );
    } catch (err) {
      console.log("erro check status:", err);
      return new HttpException("Error to check status", 400);
    }

    console.log("Status: ", retrieveRun.status);

    if (retrieveRun.status === "requires_action") {
      return this.processToolCall(retrieveRun);
    } else if (retrieveRun.status === "completed") {
      await this.updateStatus(user.userId, "completed");
      return "completed";
    } else if (retrieveRun.status === "in_progress") {
      await this.updateStatus(user.userId, "in_progress");
      return this.checkStatus(retrieveRun, user);
    } else if (retrieveRun.status === "failed") {
      if (
        retrieveRun.last_error &&
        retrieveRun.last_error.code.includes("rate_limit_exceeded")
      ) {
        console.log(
          "Deu Erro error last message: ",
          retrieveRun.last_error.message
        );
        console.log("error last code: ", retrieveRun.last_error.code);
        throw new HttpException(retrieveRun.last_error.message, 400);
      }
    }

    return this.checkStatus(retrieveRun, user);
  }

  private async updateStatus(userID: string, status: string) {
    const user = await this.userService.findByUserId(userID);
    user.status = status;
    await this.userService.create(user);
  }

  private async listMessages(threadId: string, limit: number) {
    if (limit > 5) {
      throw new HttpException("Limit is greater than 5", 400);
    }

    try {
      console.log("Listando mensagens");
      const messages = await this.clinet.beta.threads.messages.list(threadId);
      const messageData = messages.data[0];
      if (messageData.role === "user") {
        await delay(1000);
        return await this.listMessages(threadId, limit + 1);
      }

      const message = messageData.content[0] as TextContentBlock;
      return message.text.value;
    } catch (err) {
      console.log("erro list messages:", err);
      throw new HttpException("Error to list messages", 400);
    }
  }

  private async processToolCall(run: Run) {}
}
