import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ErrorCode } from '../enums/error-code.enum';

type Direction = 'ASC' | 'DESC';

export interface ISorting {
  [field: string]: Direction;
}

export const SortingParams = createParamDecorator((validParams, ctx: ExecutionContext): ISorting => {
  const req: Request = ctx.switchToHttp().getRequest();
  const sort = req.query.sort as string;
  if (!sort) return null;

  // check if the valid params sent is an array
  if (typeof validParams !== 'object') throw new BadRequestException(ErrorCode.InvalidSortParams);

  // check the format of the sort query param
  const sortPattern = /^([a-zA-Z0-9_]+):(ASC|DESC|asc|desc)$/;
  if (!sort.match(sortPattern)) throw new BadRequestException(ErrorCode.InvalidSortParams);

  // extract the field name and direction and check if they are valid
  const [field, direction] = sort.split(':');
  if (!validParams.includes(field)) throw new BadRequestException(`${ErrorCode.InvalidSortParams}:${field}`);

  return {
    [field]: direction.toUpperCase() as Direction,
  };
});
