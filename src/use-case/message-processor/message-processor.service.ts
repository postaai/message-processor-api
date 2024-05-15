import { HttpException, Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { delay } from "src/utils/delay";
import { OpenAiClient } from "src/config/openaiclient/openai-client";
import { UserService } from "src/infra/database/services/user.service";
import { User } from "src/infra/database/models/user.model";
import { Run } from "openai/resources/beta/threads/runs/runs";
import { ImoveisService } from "src/infra/database/services/imoveis.service";
import { postSendResume } from "src/infra/whtasapp/whatsapp.service";
import {
  fetchJobs,
  postSendCurriculo,
} from "src/infra/bigfoods/bigfoods.service";
import { TextContentBlock } from "openai/resources/beta/threads/messages";

//const assistantID = process.env.ASSISTANT_ID;

@Injectable()
export class MessageProcessorUseCase {
  private clinet: OpenAI;
  constructor(
    private openAiClient: OpenAiClient,
    private userService: UserService,
    private imovelService: ImoveisService
  ) {
    this.clinet = this.openAiClient.getClient();
  }

  async process(userId: string, message: string) {
    let user = await this.userService.findByUserId(userId);
    if (!user) {
      const assistantId = process.env.DEFAULT_ASSISTANT_ID;
      user = await this.createUser(userId, assistantId);
      console.log("Novo usuario criado!");
    }
    console.log("usuario: ---->", user);
    if (user.status != "completed") {
      return await this.processMessage(user, message);
    }
    return "Estou processando sua ultima mensagem, por favor envie somente uma mensagem por vez para melhor atendimento!";
  }

  async createUser(userId: string, assistantId: string) {
    const newThread = await this.clinet.beta.threads.create();

    return await this.userService.create({
      userId,
      threadId: newThread.id,
      assistantId: assistantId,
      createdAt: new Date(),
    });
  }

  private async processMessage(user: User, message: string) {
    try {
      console.log("Mensagem enviada para OpenAI");
      await this.clinet.beta.threads.messages.create(user.threadId, {
        content: message,
        role: "user",
        metadata: {},
      });

      console.log("Thread ID: ", user.threadId);
    } catch (err: any) {
      const errorMessage = err?.message as string;
      if (
        errorMessage.includes("Can't add messages to thread") &&
        errorMessage.includes("already has an active run")
      ) {
        throw new HttpException("thread_is_active", 400);
      }

      throw new HttpException("Error to send message to OpenAI", 400);
    }

    console.log("Criando run");

    const run = await this.clinet.beta.threads.runs.create(user.threadId, {
      assistant_id: user.assistantId,
    });

    const resultRunStatus = await this.checkStatus(run, user);

    if (resultRunStatus === "resume") {
      return "Obrigado pelo contato, um consultor irá entrar em contato em breve!";
    }

    if (resultRunStatus === "curriculo") {
      return "Obrigado pelo contato, enviei suas informações para o recrutador, boa sorte!";
    }

    if (resultRunStatus === "rate_limit_exceeded") {
      return "Desculpe, estamos com um alto volume de mensagens, por favor tente novamente mais tarde!";
    }

    if (resultRunStatus === "completed") {
      const listMessage = await this.listMessages(user.threadId, 0);
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
      const toolCalls =
        retrieveRun.required_action?.submit_tool_outputs.tool_calls;
      if (
        toolCalls.find((data) => data.function.name === "finishConversation")
      ) {
        await this.finishConversation(retrieveRun, user);
        await this.userService.deleteUserById(user.userId);
        await this.clearSession(user.userId);
        return "resume";
      } else if (
        toolCalls.find((data) => data.function.name === "sendCurriculo")
      ) {
        await this.sendCurriculo(toolCalls[0].function.arguments);
        return "curriculo";
      }
      await this.processToolCall(retrieveRun, user);
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
        return "rate_limit_exceeded";
      }
      await this.updateStatus(user.userId, "failed");
      throw new HttpException("Error to process message", 400);
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

  private async sendCurriculo(data: any) {
    try {
      await postSendCurriculo(data);
    } catch (error) {
      console.log("de enviar para o site erro ignorado", error);
    }

    try {
      await postSendResume(data);
      console.log("enviando curriculo", data);
    } catch (error) {
      console.log(error);
    }
  }

  private async finishConversation(run: Run, user: User) {
    const threadId = run.thread_id;
    const runId = run.id;
    const runObject = run;
    const toolcalls = run.required_action?.submit_tool_outputs.tool_calls;

    console.log("tool call id:", toolcalls[0].id);
    console.log("threadId", threadId);
    console.log("runId", runId);
    await this.clinet.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: [
        {
          tool_call_id: toolcalls[0].id,
          output: JSON.stringify("finalizar a conversa"),
        },
      ],
    });

    const submitStatus = await this.checkStatus(runObject, user);

    if (submitStatus === "completed") {
      await this.clinet.beta.threads.messages.create(user.threadId, {
        content: `Crie um resumo da conversa contendo as seguintes informaçĩoes em formato json, caso não encontre a informação atribua null, o telefone sempre será ${user.userId}.
                  nome:
                  telefone:
                  linkImovel:
                  formaDePagamento:
                  valorImovel:
                  valorEntrada:
                  formaDePagamento:
                  Observacaoes:`,
        role: "user",
      });

      const runRsponse = await this.clinet.beta.threads.runs.create(
        user.threadId,
        {
          assistant_id: user.assistantId,
        }
      );

      const status = await this.checkStatus(runRsponse, user);

      if (status === "completed") {
        const listMessage = await this.listMessages(user.threadId, 0);
        console.log({ data: listMessage });
        await postSendResume(listMessage);
        return { message: "Obrigado!" };
      }
    }
  }

  private async processToolCall(run: Run, user: User) {
    const threadId = run.thread_id;
    const runId = run.id;
    const toolcalls = run.required_action?.submit_tool_outputs.tool_calls;

    if (!toolcalls) {
      return;
    }

    console.log("processing tool calls...", toolcalls);

    let toolOutputs: any = [];

    const functions: {
      [key: string]: (args?: any) => Promise<any>;
    } = {
      getImoveis: async (args: any) => await this.imovelService.findAll(),
      getJobs: async () => {
        await delay(1000);
        return await fetchJobs();
      },
    };

    for (const toolCall of toolcalls) {
      const functionName = toolCall.function.name;
      const args = toolCall.function?.arguments;

      const output = await functions[functionName](args);

      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(output),
      });
    }

    console.log("toolOutputs: ", toolOutputs);

    const runSubmit = await this.clinet.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: toolOutputs,
      }
    );

    console.log("runSubmit: ", runSubmit);

    await this.checkStatus(run, user);
  }

  async clearSession(userId: string) {
    const user = await this.userService.findByUserId(userId);
    if (!user) return false;

    this.clinet.beta.threads.del(user.threadId);

    return await this.userService.deleteUserById(userId);
  }

  async getSession(userId: string) {
    return await this.userService.findByUserId(userId);
  }
}
