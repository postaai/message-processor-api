import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: "userEntity" })
export class User {
  @Prop()
  userId: string;
  @Prop()
  name?: string;
  @Prop()
  status?: string;
  @Prop()
  threadId: string;
  @Prop()
  assistantId: string;
  @Prop()
  contactName?: string;
  @Prop()
  cratedAt: Date;
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
