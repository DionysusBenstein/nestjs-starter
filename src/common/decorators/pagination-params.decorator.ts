import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ErrorCode } from '../enums/error-code.enum';

export interface IPagination {
  limit: number;
  offset: number;
  page?: number; // for infinite scroll on client side
}

export type PaginatedResource<T> = {
  totalCount: number;
  items: T[];
  page?: number; // for infinite scroll on client side
};

export const PaginationParams = createParamDecorator((data, ctx: ExecutionContext): IPagination => {
  const req: Request = ctx.switchToHttp().getRequest();
  const page = parseInt(req.query.page as string);
  const size = parseInt(req.query.size as string);

  // check if page and size are valid
  if (isNaN(page) || page < 0 || isNaN(size) || size < 0) {
    throw new BadRequestException(ErrorCode.InvalidPaginationParams);
  }
  // do not allow to fetch large slices of the dataset
  if (size > 250) {
    throw new BadRequestException(ErrorCode.MaximumChunkSizeExceeded);
  }

  const limit = size;
  const offset = (page - 1) * limit;
  return { limit, offset, page };
});
