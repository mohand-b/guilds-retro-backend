import { IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  text: string;

  @IsOptional()
  image: Buffer;
}
