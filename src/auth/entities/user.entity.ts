import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  username: string;

  @Column({ unique: true, length: 100 })
  @Index()
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  emailVerificationToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationExpires: Date | string | null;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordTokenExpires: Date | string | null;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  refreshToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  refreshTokenExpires?: Date | string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
