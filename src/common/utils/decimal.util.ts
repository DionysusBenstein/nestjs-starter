import { ColumnOptions } from "typeorm";
import { ColumnDecimalTransformer } from "../transformers/column-decimal.transformer";

export const DECIMAL_OPTIONS: ColumnOptions = {
  type: "decimal",
  precision: 38,
  scale: 18,
  default: 0,
  transformer: new ColumnDecimalTransformer(),
};

