import { User } from '../../users/entities/user.entity';

export class EventFeedDto {
  id: number;
  title: string;
  description: string;
  type: string;
  dungeonName?: string;
  arenaTargets?: string;
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
