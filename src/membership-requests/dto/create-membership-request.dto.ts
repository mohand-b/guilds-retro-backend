import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateMembershipRequestDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  guildId: number;
}
