import { Global, Module } from '@nestjs/common';
import { OpenAiClient } from './openai-client';

@Global()
@Module({})
export class OpenAiModule {
  static forRoot() {
    return {
      module: OpenAiModule,
      providers: [OpenAiClient],
      exports: [OpenAiClient],
    };
  }
}
