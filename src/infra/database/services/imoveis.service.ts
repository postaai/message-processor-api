import e from "express";
import { Model } from "mongoose";
import { Imovel } from "../models/imoveis.model";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

export interface ImovelDataType {  
    tipo: string;
    cidade: string;
    bairro: string;
    valor: string;
    "tamanho-lote": string;
    "area-construida": string;
    banheiros: number;
    quartos: number;
    suites: number;
    "vagas-garagem": number;
    "garagem-coberta": string;
    obervacao: string;
    fotos: string;
    documentacao: string;
    }

@Injectable()
export class ImoveisService {  
    constructor(@InjectModel(Imovel.name) private imovelModel: Model<Imovel>) {}
  
    async findAll(){
      return await this.imovelModel.find().exec()
    }
  }