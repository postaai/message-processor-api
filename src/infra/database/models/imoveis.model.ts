import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import e from "express";
import { HydratedDocument } from "mongoose";

export type ImovelDocument = HydratedDocument<Imovel>;

@Schema({ collection: "imoveis" })
export class Imovel {
  @Prop()
  tipo: String;
  @Prop()
  cidade: String;
  @Prop()
  bairro: String;
  @Prop()
  valor: String;
  @Prop()
  "tamanho-lote": String;
  @Prop()
  "area-construida": String;
  @Prop()
  banheiros: Number;
  @Prop()
  quartos: Number;
  @Prop()
  suites: Number;
  @Prop()
  "vagas-garagem": Number;
  @Prop()
  "garagem-coberta": String;
  @Prop()
  obervacao: String;
  @Prop()
  fotos: String;
  @Prop()
  documentacao: String;
}

export const ImovelSchema = SchemaFactory.createForClass(Imovel);