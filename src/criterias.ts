import type { DynamicParameter } from './definitions';
import type { SQLBuilder } from './request';

export type ConditionParameter = DynamicParameter;

export type ConditionList = { [column: string]: DynamicParameter };

export type Condition = [column: string, expected: ConditionParameter];

export function addCondition(builder: SQLBuilder, [column, value]: Condition) {
  builder.addIdentifier(column);
  if (value === null) {
    builder.addSQL(' IS ');
    builder.printSimpleParameter(value);
  } else {
    builder.addSQL(' = ');
    builder.renderDynamicParameter(value);
  }
}
