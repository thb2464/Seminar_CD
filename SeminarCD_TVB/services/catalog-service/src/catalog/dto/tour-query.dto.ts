import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const LOCALES = ['vi', 'en', 'zh'] as const;
const REGIONS = ['MienBac', 'MienTrung', 'MienNam', 'TayNguyen', 'NhieuVung'] as const;

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 25;
}

export class TourFilterDto {
  @IsOptional()
  @IsIn(REGIONS as unknown as string[])
  region?: (typeof REGIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}

export class TourQueryDto {
  @IsOptional()
  @IsIn(LOCALES as unknown as string[])
  locale: (typeof LOCALES)[number] = 'vi';

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sort?: string;

  @IsOptional()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;

  @IsOptional()
  @Type(() => TourFilterDto)
  filters?: TourFilterDto;
}
