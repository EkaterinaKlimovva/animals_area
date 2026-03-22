export interface AreaPointDto {
  latitude: number;
  longitude: number;
}

export interface CreateAreaRequestDto {
  name: string;
  areaPoints: AreaPointDto[];
}

export interface UpdateAreaRequestDto extends CreateAreaRequestDto {}

export interface AreaAnalyticsQueryDto {
  startDate: string;
  endDate: string;
}

export interface AreaResponseDto {
  id: number;
  name: string;
  areaPoints: AreaPointDto[];
}
