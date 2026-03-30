export interface AreaPointDto {
  latitude: string | number;
  longitude: string | number;
}

export interface CreateAreaRequestDto {
  name: string;
  areaPoints: AreaPointDto[];
}

export type UpdateAreaRequestDto = CreateAreaRequestDto;

export interface AreaAnalyticsQueryDto {
  startDate: string;
  endDate: string;
}

export interface AreaResponseDto {
  id: number;
  name: string;
  areaPoints: AreaPointDto[];
}
