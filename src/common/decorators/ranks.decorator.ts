import { SetMetadata } from '@nestjs/common';
import { AppRank } from '../../users/enum/app-rank.enum';

export const RANKS_KEY = 'ranks';
export const Ranks = (...ranks: AppRank[]) => SetMetadata(RANKS_KEY, ranks);
