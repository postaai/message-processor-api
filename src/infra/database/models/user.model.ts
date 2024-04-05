import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  private userId: string;
  @Prop()
  private name?: string;
  @Prop()
  private status?: string;
  @Prop()
  private threadId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
