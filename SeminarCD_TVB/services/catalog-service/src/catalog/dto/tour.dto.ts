import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const LOCALES = ['vi', 'en', 'zh'] as const;
const REGIONS = ['MienBac', 'MienTrung', 'MienNam', 'TayNguyen', 'NhieuVung'] as const;
const TRANSPORT = ['XeKhach', 'MayBay', 'Tau', 'XeMay', 'KetHop'] as const;

export class HighlightDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  iconUrl?: string;
}

export class GalleryImageDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;
}

export class CreateTourDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  documentId?: string;

  @IsIn(LOCALES as unknown as string[])
  locale: (typeof LOCALES)[number] = 'vi';

  @IsString()
  @Length(1, 255)
  slug!: string;

  @IsString()
  @Length(1, 500)
  tourName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  shortDescription?: string;

  @IsOptional()
  @IsObject()
  description?: unknown;

  @IsOptional()
  @IsIn(REGIONS as unknown as string[])
  region?: (typeof REGIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  departureLocation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  childPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationNights?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @IsOptional()
  @IsIn(TRANSPORT as unknown as string[])
  transportType?: (typeof TRANSPORT)[number];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => HighlightDto)
  @ValidateNested({ each: true })
  highlights?: HighlightDto[];

  @IsOptional()
  @IsObject()
  itinerary?: unknown;

  @IsOptional()
  @Type(() => GalleryImageDto)
  @ValidateNested({ each: true })
  gallery?: GalleryImageDto[];

  @IsOptional()
  @IsUrl({ require_tld: false })
  featuredImageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tourCategoryId?: number;
}

export class UpdateTourDto extends CreateTourDto {}
