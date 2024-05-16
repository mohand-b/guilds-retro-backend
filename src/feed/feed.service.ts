import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Guild } from '../guilds/entities/guild.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Guild)
    private guildRepository: Repository<Guild>,
  ) {}

  async getFeed(): Promise<PostEntity[]> {
    /*
    Nous devons créer le feed de notre user.

    Si notre user à son feedClosingToGuildAndAllies à true,
    alors nous devons récupérer les posts des membres sa guilde et
    des membres des guildes alliées.

    Si notre user à son feedClosingToGuildAndAllies à false,
    alors nous devons récupérer les posts de tous les utilisateurs sauf ceux qui
    ont leur feedClosingToGuildAndAlliesà true et qui ne sont pas dans la guilde
    de notre user ou guildes alliées.

    Les posts doivent être triés par date de création décroissante.
    
     */
    return [];
  }
}
