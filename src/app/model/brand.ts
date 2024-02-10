import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/db/mongo/mongo.default';

@Schema({ versionKey: false, timestamps: true })
export class Brand extends AbstractDocument{

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  mobile: number;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);