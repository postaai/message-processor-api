import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema( { collection: 'userEntity' })
export class User {
  @Prop()
  userId: string;
  @Prop()
  name?: string;
  @Prop()
  status?: string;
  @Prop()
  threadId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
