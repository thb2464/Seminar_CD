import { IsInt, IsNotEmpty, IsString, IsEmail, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsNotEmpty()
  tour: number;

  @IsInt()
  @Min(1)
  adult_count: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  child_count?: number;

  @IsString()
  @IsNotEmpty()
  travel_date: string;

  @IsString()
  @IsNotEmpty()
  contact_name: string;

  @IsEmail()
  @IsNotEmpty()
  contact_email: string;

  @IsString()
  @IsNotEmpty()
  contact_phone: string;
}
