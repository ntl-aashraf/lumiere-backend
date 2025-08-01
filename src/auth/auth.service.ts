import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToClass } from 'class-transformer';
import { EmailService } from 'src/services/email.service';

export interface AuthResponse {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      });

      if (existingUser) {
        if (existingUser.email === createUserDto.email) {
          throw new ConflictException('Email already exists');
        }
        if (existingUser.username === createUserDto.username) {
          throw new ConflictException('Username already exists');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ); // 24 hours

      // Create user
      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationExpires,
      });

      const savedUser = await this.userRepository.save(user);

      // Send verification email
      await this.emailService.sendVerificationEmail(
        savedUser.email,
        emailVerificationToken,
        savedUser.username,
      );

      // Generate JWT tokens
      const tokens = await this.generateTokens(savedUser);

      // Save refresh token
      await this.saveRefreshToken(savedUser.id, tokens.refreshToken);

      return plainToClass(UserResponseDto, savedUser, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      // Handle database constraint errors
      if (error.code === '23505') {
        if (error.constraint?.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        if (error.constraint?.includes('username')) {
          throw new ConflictException('Username already exists');
        }
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: [
          { email: loginUserDto.usernameOrEmail },
          { username: loginUserDto.usernameOrEmail },
        ],
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!(user instanceof User)) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = await bcrypt.compare(
        loginUserDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Generate JWT tokens
      const tokens = await this.generateTokens(user);

      await this.saveRefreshToken(user.id, tokens.refreshToken);
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      return {
        user: plainToClass(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Authentication failed');
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (
        !user ||
        !user.refreshToken ||
        !user.refreshTokenExpires ||
        user.refreshTokenExpires < new Date()
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValidRefreshToken = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isValidRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepository.update(user.id, {
      emailVerificationToken,
      emailVerificationExpires,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
      user.username,
    );

    return { message: 'Verification email sent' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.userRepository.update(userId, {
      refreshToken: null,
      refreshTokenExpires: null,
    });

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
      refreshTokenExpires,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async sendForgetPasswordEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    await this.userRepository.update(user.id, {
      resetPasswordToken,
      resetPasswordTokenExpires,
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetPasswordToken,
      user.username,
    );

    return { message: 'Verification email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordTokenExpires ||
      user.resetPasswordTokenExpires < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null,
    });

    return { message: 'Password has been successfully reset' };
  }
}
