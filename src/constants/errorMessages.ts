export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  MISSING_AUTH: 'Authentication required',
  INVALID_TOKEN: 'Invalid token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // Validation
  INVALID_COORDINATES: 'Invalid coordinates',
  COORDINATES_OUT_OF_RANGE: 'Coordinates out of range',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be at least 6 characters',
  
  // Area validation
  AREA_MIN_POINTS: 'Area points must contain at least 3 points',
  AREA_DUPLICATE_POINTS: 'Area must not contain duplicate points',
  AREA_COLLINEAR: 'All area points lie on one line',
  AREA_ANTIMERIDIAN: 'Area cannot cross the antimeridian',
  AREA_TOO_SMALL: 'Area is too small',
  AREA_SELF_INTERSECT: 'Area borders intersect themselves',
  AREA_NOT_FOUND: 'Area not found',
  AREA_NAME_EXISTS: 'Area with same name already exists',
  
  // Location validation
  LOCATION_NOT_FOUND: 'Location not found',
  LOCATION_COORDINATES_EXIST: 'Location with same coordinates already exists',
  LOCATION_USED_BY_ANIMALS: 'Location is used by animals',
  
  // Animal validation
  ANIMAL_NOT_FOUND: 'Animal not found',
  ANIMAL_CHIP_NUMBER_EXISTS: 'Animal with chip number already exists',
  ANIMAL_NOT_AT_LOCATION: 'Animal is not at specified location',
  
  // Analytics
  INVALID_DATE_RANGE: 'Invalid date range',
  START_DATE_BEFORE_END: 'startDate must be before endDate',
  INVALID_ANALYTICS_PERIOD: 'Invalid analytics period',
  
  // General
  INVALID_ID: 'Invalid ID',
  RESOURCE_NOT_FOUND: 'Resource not found',
  DUPLICATE_RESOURCE: 'Resource already exists',
  
  // GeoHash
  GEohASH_COORDINATES_REQUIRED: 'Latitude and longitude are required',
  GEohASH_INVALID_COORDINATES: 'Invalid coordinates',
} as const;
