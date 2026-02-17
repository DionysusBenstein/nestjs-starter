import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import {
  Between,
  ILike,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from 'typeorm';
import { ErrorCode } from '../enums/error-code.enum';

export type EntityFields<T> = (keyof T)[];
export type FilteringResult = Record<string, unknown>;

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
    const values = filter.value.split(',').filter((v) => v.trim() !== '');
    return values.length > 0 ? In(values) : {};
  }
  if (filter.rule == FilterRule.NOT_IN) {
    const values = filter.value.split(',').filter((v) => v.trim() !== '');
    return values.length > 0 ? Not(In(values)) : {};
  }
  if (filter.rule == FilterRule.BETWEEN) {
    const [from, to] = filter.value.split(',') as [string?, string?];
    if (!from || !to) return {};
    return Between(from, to);
  }

  return {};
}

function ensureObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const FilteringParams = createParamDecorator(
  (data: readonly string[], ctx: ExecutionContext): FilteringResult | null => {
    const req: Request = ctx.switchToHttp().getRequest();
    const rawFilters = req.query.filters;
    const queryFilters = Array.isArray(rawFilters)
      ? rawFilters
      : typeof rawFilters === 'string'
        ? [rawFilters]
        : null;

    if (!queryFilters) return null;
    if (!Array.isArray(data)) throw new BadRequestException(ErrorCode.InvalidFilterParams);

    const filters: FilteringResult = {};

    for (const filter of queryFilters) {
      if (typeof filter !== 'string') {
        throw new BadRequestException(ErrorCode.InvalidFilterParams);
      }

      const [fieldPath, rule, value] = filter.split(':');

      if (!fieldPath || !rule || value === undefined) {
        throw new BadRequestException(ErrorCode.InvalidFilterParams);
      }

      const fieldParts = fieldPath.split('.');
      const field = fieldParts.pop();

      if (!field) {
        throw new BadRequestException(ErrorCode.InvalidFilterParams);
      }

      let nestedFilters: Record<string, unknown> = filters;
      
      for (const part of fieldParts) {
        const existing = nestedFilters[part];

        if (!ensureObjectRecord(existing)) {
          nestedFilters[part] = {};
        }

        nestedFilters = nestedFilters[part] as Record<string, unknown>;
      }

      if (!data.includes(fieldPath)) {
        throw new BadRequestException(`${ErrorCode.FilterFieldNotAllowed}:${field}`);
      }

      if (!Object.values(FilterRule).includes(rule as FilterRule)) {
        throw new BadRequestException(`${ErrorCode.InvalidFilterParams}:${rule}`);
      }

      const isEmptyValueRule = [
        FilterRule.EQUALS,
        FilterRule.NOT_EQUALS,
        FilterRule.IN,
        FilterRule.NOT_IN,
      ].includes(rule as FilterRule) && (!value || value.trim() === '');

      if (isEmptyValueRule) {
        continue;
      }

      const whereClause = getWhere({ field, rule, value });

      if (ensureObjectRecord(whereClause) && Object.keys(whereClause).length === 0) {
        continue;
      }

      nestedFilters[field] = whereClause;
    }

    return filters;
  },
);
