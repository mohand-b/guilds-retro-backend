import { IsInt, IsNotEmpty } from 'class-validator';

export class JoinEventDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  eventId: number;
}
