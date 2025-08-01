import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  isActive: boolean;

  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  emailVerified: boolean;

  @Expose()
  createdAt: Date;

  @Exclude()
  password: string;
}
