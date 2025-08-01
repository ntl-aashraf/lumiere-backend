import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('favorites')
@Index(['userId', 'videoId'], { unique: true })
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'videoId' })
  videoId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ name: 'channelTitle', nullable: true })
  channelTitle: string;

  @Column({ name: 'channelId', nullable: true })
  channelId: string;

  @Column({ name: 'watchUrl' })
  watchUrl: string;

  @Column({ name: 'publishedAt', type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ default: 'video' })
  type: string;

  @CreateDateColumn({ name: 'addedAt' })
  addedAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
