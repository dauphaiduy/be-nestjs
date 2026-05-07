import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { comparePassword } from 'src/common/utils/hash.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = loginDto;
    const user = await this.userService.findOne(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user?.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async register(registerDto: RegisterDto) {
    const { username, email } = registerDto;
    const existingUser = await this.userService.findOne(username);
    if (existingUser) {
      throw new UnauthorizedException('Username already exists');
    }
    const existingEmail = await this.userService.findOne(email);
    if (existingEmail) {
      throw new UnauthorizedException('Email already exists');
    }
    return this.userService.create(registerDto);
  }
}
