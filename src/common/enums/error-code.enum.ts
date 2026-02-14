export enum ErrorCode {
  // Auth errors
  WrongPassword = 'wrong-password',
  BlockedUser = 'blocked-user',
  UserWithEmailNotFound = 'user-with-email-not-found',
  UserAlreadyExists = 'user-already-exists',
  UserNotFound = 'user-not-found',
  InvalidRefreshToken = 'invalid-refresh-token',
  InvalidResetToken = 'invalid-reset-token',
  InvalidToken = 'invalid-token',
  VerificationCodeSent = 'verification-code-sent',
  InvalidVerificationCode = 'invalid-verification-code',
  UserNotVerified = 'user-not-verified',

  // Query params errors
  InvalidPaginationParams = 'invalid-pagination-params',
  MaximumChunkSizeExceeded = 'maximum-chunk-size-250-exceeded',
  InvalidSortParams = 'invalid-sort-params',
  InvalidFilterParams = 'invalid-filter-params',
  FilterFieldNotAllowed = 'filter-field-not-allowed',
}
