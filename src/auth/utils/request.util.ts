import { Request } from 'express';

export function extractTokenFromHeader(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];

  if (type === 'Bearer') {
    return token;
  }
}
