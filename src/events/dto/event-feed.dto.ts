import { User } from '../../users/entities/user.entity';

export class EventFeedDto {
  id: number;
  type: string;
  title?: string;
  dungeonName?: string;
  arenaTargets?: string;
  description?: string;
  maxParticipants: number;
  minLevel?: number;
  requiredClasses?: string[];
  requiresOptimization?: boolean;
  creator: User;
  participants: User[];
  isAccessibleToAllies: boolean;
  createdAt: Date;
  feedId: string;
  feedType: string = 'event';
}
