import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../infrastructure/user.repository.js';
import { LoginDTO, LoginResponse, CreateUserDTO, UserWithRole } from '../domain/user.entity.js';
import { env } from '../../../infrastructure/config/env.js';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async login(data: LoginDTO): Promise<LoginResponse> {
    const user = await this.userRepo.findByUsername(data.username);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated. Contact administrator.');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account is locked. Try again later.');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);

    if (!isValidPassword) {
      await this.userRepo.incrementFailedLogin(user.id);

      if (user.failed_login_attempts >= 4) {
        await this.userRepo.lockUser(user.id, 30);
        throw new Error('Account locked due to too many failed attempts. Try again in 30 minutes.');
      }

      throw new Error('Invalid username or password');
    }

    await this.userRepo.updateLastLogin(user.id);

    const token = jwt.sign(
      { userId: user.id, username: user.username, role_id: user.role_id },
      env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    return {
      user: userWithoutPassword as Omit<typeof user, 'password_hash'>,
      token,
    };
  }

  async register(data: CreateUserDTO): Promise<UserWithRole> {
    const existingUsername = await this.userRepo.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userRepo.create(data, passwordHash);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const fullUser = await this.userRepo.findByUsername(user.username);
    if (!fullUser) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(oldPassword, fullUser.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    return this.userRepo.updatePassword(userId, newHash);
  }

  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    const hash = await bcrypt.hash(newPassword, 10);
    return this.userRepo.updatePassword(userId, hash);
  }

  async verifyToken(token: string): Promise<any> {
    return jwt.verify(token, env.JWT_SECRET);
  }
}
