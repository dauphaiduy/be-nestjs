import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountType, UserType } from '@prisma/client';
import { comparePassword } from 'src/common/utils/hash.util';
import { RolesService } from '../roles/roles.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {}
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = loginDto;
    const user = await this.userService.findOne(username);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (
      user.userType !== UserType.CUSTOMER &&
      user.userType !== UserType.ADMIN
    ) {
      throw new UnauthorizedException('This account is not a customer account');
    }
    const payload = {
      username: user.username,
      sub: user.id,
      userType: user.userType,
      permissions: [],
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async adminLogin(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = loginDto;
    const user = await this.userService.findOne(username);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.userType === UserType.CUSTOMER) {
      throw new UnauthorizedException(
        'This account is not authorized for the admin panel',
      );
    }
    const permissions = await this.getPermissions(user.roleId);
    const payload = {
      username: user.username,
      sub: user.id,
      userType: user.userType,
      permissions,
    };
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
    return this.userService.create({
      ...registerDto,
      accountType: AccountType.LOCAL,
      userType: UserType.CUSTOMER,
    });
  }

  async getPermissions(roleId: number | null): Promise<string[]> {
    if (!roleId) return [];
    const role = await this.rolesService.findOne(roleId);
    let permissions: string[] = [];
    permissions = permissions.concat((role.permissions as Array<string>) || []);
    return Array.from(permissions);
  }
}
