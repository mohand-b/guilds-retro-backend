import { User } from '../../users/entities/user.entity';

export class EventDto {
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
}
