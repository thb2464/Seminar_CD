import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password!: string;
}
