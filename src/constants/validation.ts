export const COORDINATE_LIMITS = {
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
} as const;

export const AREA_VALIDATION = {
  MIN_POINTS: 3,
  MIN_AREA_SIZE: 0.1,
  MAX_LON_SPAN: 180,
  EPSILON: 1e-4,
} as const;

export const GEOHASH = {
  BASE32: '0123456789bcdefghjkmnpqrstuvwxyz',
  DEFAULT_PRECISION: 12,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export const AUTH = {
  SCHEME_PREFIX: 'Basic ',
  TOKEN_PREFIX: 'Bearer ',
} as const;
