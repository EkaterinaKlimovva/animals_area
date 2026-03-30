export interface LocationRequestDto {
  latitude: string | number;
  longitude: string | number;
}

export interface LocationResponseDto {
  id: number;
  latitude: string;
  longitude: string;
}
