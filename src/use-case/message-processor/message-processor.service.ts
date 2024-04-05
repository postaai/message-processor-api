import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages/messages';
import { delay } from 'src/utils/delay';
import { OpenAiClient } from 'src/config/openaiclient/openai-client';
import { UserRepository } from 'src/infra/database/repository/user.repository';

@Injectable()
export class MessageProcessorUseCase {
  private clinet: OpenAI;
  constructor(
    private openAiClient: OpenAiClient,
    private userRepository: UserRepository,
  ) {
    this.clinet = this.openAiClient.getClient();
  }

  async processMessage(userId: string, message: string) {
    const assistantID = 'asst_sVmJSAWXTV7Cdkn495cQaMO7';

    // let user = await this.userRepository.findUser(userId);
    // if (!user) {
    //   const newThread = await this.clinet.beta.threads.create();
    //   user = await this.userRepository.createUser({
    //     userId: userId,
    //     threadId: newThread.id,
    //   });
    // }
    await this.clinet.beta.threads.messages.create('threadId', {
      content: message,
      role: 'user',
    });

    await this.clinet.beta.threads.runs.create('threadId', {
      assistant_id: assistantID,
    });

    await delay(5000);

    const messages = await this.clinet.beta.threads.messages.list('threadId');
    const messageOpenAi = messages.data[0].content[0] as TextContentBlock;

    return messageOpenAi.text.value;
  }
}
