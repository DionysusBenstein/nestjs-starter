import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Between, ILike, In, IsNull, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Not } from "typeorm";
import { ErrorCode } from '../enums/error-code.enum';

export type EntityFields<T> = (keyof T)[];

export interface IFiltering {
  [field: string]: string;
}

interface IFilteringParams {
  field: string;
  rule: string;
  value: string;
}

// valid filter rules
export enum FilterRule {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  LIKE = 'like',
  NOT_LIKE = 'nlike',
  IN = 'in',
  NOT_IN = 'nin',
  IS_NULL = 'isnull',
  IS_NOT_NULL = 'isnotnull',
  BETWEEN = 'between',
}

export const getWhere = (filter: IFilteringParams) => {
  if (!filter) return {};

  if (filter.rule == FilterRule.IS_NULL) return IsNull();
  if (filter.rule == FilterRule.IS_NOT_NULL) return Not(IsNull());
  if (filter.rule == FilterRule.EQUALS) {
    if (!filter.value || filter.value.trim() === '') return {};
    return filter.value;
  }
  if (filter.rule == FilterRule.NOT_EQUALS) {
    if (!filter.value || filter.value.trim() === '') return {};
    return Not(filter.value);
  }
  if (filter.rule == FilterRule.GREATER_THAN) return MoreThan(filter.value);
  if (filter.rule == FilterRule.GREATER_THAN_OR_EQUALS) return MoreThanOrEqual(filter.value);
  if (filter.rule == FilterRule.LESS_THAN) return LessThan(filter.value);
  if (filter.rule == FilterRule.LESS_THAN_OR_EQUALS) return LessThanOrEqual(filter.value);
  if (filter.rule == FilterRule.LIKE) return ILike(`%${filter.value}%`);
  if (filter.rule == FilterRule.NOT_LIKE) return Not(ILike(`%${filter.value}%`));
  if (filter.rule == FilterRule.IN) {
    const values = filter.value.split(',').filter(v => v.trim() !== '');
    return values.length > 0 ? In(values) : {};
  }
  if (filter.rule == FilterRule.NOT_IN) {
    const values = filter.value.split(',').filter(v => v.trim() !== '');
    return values.length > 0 ? Not(In(values)) : {};
  }
  if (filter.rule == FilterRule.BETWEEN) return Between(...(filter.value.split(',') as [string, string]));
}

export const FilteringParams = createParamDecorator((data, ctx: ExecutionContext): IFiltering => {
  const req: Request = ctx.switchToHttp().getRequest();
  const queryFilters = req.query.filters as string[];

  if (!queryFilters || !Array.isArray(queryFilters)) return null;

  if (typeof data !== 'object') throw new BadRequestException(ErrorCode.InvalidFilterParams);

  let filters: { [field: string]: any } = {};

  for (const filter of queryFilters) {
    const [fieldPath, rule, value] = filter.split(':');

    const fieldParts = fieldPath.split('.');
    const field = fieldParts.pop();
    let nestedFilters = filters;
    for (const part of fieldParts) {
      nestedFilters[part] = nestedFilters[part] || {};
      nestedFilters = nestedFilters[part];
    }

    if (!data.includes(fieldPath)) throw new BadRequestException(`${ErrorCode.FilterFieldNotAllowed}:${field}`);
    if (!Object.values(FilterRule).includes(rule as FilterRule)) throw new BadRequestException(`${ErrorCode.InvalidFilterParams}:${rule}`);

    if ((rule === FilterRule.EQUALS || rule === FilterRule.NOT_EQUALS || rule === FilterRule.IN || rule === FilterRule.NOT_IN) 
        && (!value || value.trim() === '')) {
      continue;
    }

    const whereClause = getWhere({ field, rule, value });

    if (whereClause && (typeof whereClause === 'object' && Object.keys(whereClause).length === 0)) {
      continue;
    }

    nestedFilters[field] = whereClause;
  }

  return filters;
});
