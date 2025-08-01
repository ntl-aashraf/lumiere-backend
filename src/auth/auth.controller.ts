import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UnauthorizedException,
  Logger,
  Get,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger: Logger;
  constructor(private readonly authService: AuthService) {
    this.logger = new Logger(AuthController.name);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      this.logger.log(`Creating user with username: ${createUserDto.username}`);

      const result = await this.authService.create(createUserDto);

      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      this.logger.log(`User created successfully with ID: ${result.id}`);

      return {
        message:
          'User created successfully. Please check your email to verify your account.',
        user: result,
        accessToken: result.accessToken,
      };
    } catch (error: any) {
      this.logger.error(`User creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      this.logger.log(`Login attempt for: ${loginUserDto.usernameOrEmail}`);

      const result = await this.authService.login(loginUserDto);

      // Set HTTP-only cookie for refresh token
      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      this.logger.log(`User logged in successfully: ${result.user.id}`);

      return {
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const refreshToken = request.cookies.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new refresh token cookie
      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      return {
        message: 'Token refreshed successfully',
        accessToken: result.accessToken,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: Request & { user: any },
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      await this.authService.logout(request.user.id);

      // Clear refresh token cookie
      response.clearCookie('refreshToken');

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    try {
      if (!token) {
        throw new UnauthorizedException('Verification token is required');
      }

      const result = await this.authService.verifyEmail(token);

      return result;
    } catch (error) {
      this.logger.error(
        `Email verification failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(@Body('email') email: string) {
    try {
      if (!email) {
        throw new UnauthorizedException('Email is required');
      }

      const result = await this.authService.resendVerificationEmail(email);

      return result;
    } catch (error: unknown) {
      const myError = error as Error;
      this.logger.error(
        `Resend verification failed: ${myError.message}`,
        myError.stack,
      );
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@Req() request: Request & { user: any }) {
    return {
      user: request.user,
    };
  }

  @Get('check-auth')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  checkAuth(@Req() request: Request & { user: any }) {
    return {
      authenticated: true,
      user: request.user,
    };
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body('email') email: string) {
    try {
      if (!email) {
        throw new UnauthorizedException('Email is required');
      }

      const result = await this.authService.sendForgetPasswordEmail(email);

      return result;
    } catch (error: unknown) {
      const myError = error as Error;
      this.logger.error(
        `Resend verification failed: ${myError.message}`,
        myError.stack,
      );
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    const { token, password } = body;
    try {
      if (!token || !password) {
        throw new UnauthorizedException('Token and password are required');
      }

      const result = await this.authService.resetPassword(token, password);
      return result;
    } catch (error: unknown) {
      const myError = error as Error;
      this.logger.error(
        `Reset password failed: ${myError.message}`,
        myError.stack,
      );
      throw error;
    }
  }
}
