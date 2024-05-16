import { IsBoolean } from 'class-validator';

export class UpdateFeedPreferenceDto {
  @IsBoolean()
  readonly feedClosingToGuildAndAllies: boolean;
}
