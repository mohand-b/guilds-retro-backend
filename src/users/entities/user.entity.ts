import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Guild } from '../../guilds/entities/guild.entity';
import { CharacterClass } from '../enum/character-class.enum';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../enum/user-role.enum';
import { MembershipRequest } from '../../membership-requests/entities/membership-request.entity';
import { Gender } from '../enum/gender.enum';
import { PostEntity } from '../../posts/entities/post.entity';
import { Like } from '../../likes/entities/like.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Job } from './job.entity';
import { AccountLinkRequest } from './account-link-request.entity';
import { AccountLinkGroup } from './account-link-group.entity';
import { OneWordQuestionnaire } from './one-word-questionnaire.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: CharacterClass,
  })
  characterClass: CharacterClass;

  @Column()
  characterLevel: number;

  @ManyToOne(() => Guild, (guild) => guild.members, { eager: true })
  guild: Guild;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CANDIDATE,
  })
  @Expose()
  role: UserRole;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @OneToMany(
    () => MembershipRequest,
    (membershipRequest) => membershipRequest.user,
  )
  membershipRequests: MembershipRequest[];

  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @Column({ default: false })
  feedClosingToGuildAndAllies: boolean;

  @Column({ default: false })
  hideProfile: boolean;

  @OneToMany(() => Job, (job) => job.user, { cascade: true, eager: true })
  jobs: Job[];

  @OneToMany(() => AccountLinkRequest, (request) => request.requester)
  sentLinkRequests: AccountLinkRequest[];

  @OneToMany(() => AccountLinkRequest, (request) => request.targetUser)
  receivedLinkRequests: AccountLinkRequest[];

  @ManyToOne(() => AccountLinkGroup, (group) => group.users, { lazy: true })
  linkGroup: Promise<AccountLinkGroup>;

  @OneToOne(() => OneWordQuestionnaire, (questionnaire) => questionnaire.user, {
    cascade: true,
  })
  @JoinColumn()
  questionnaire: OneWordQuestionnaire;
}
