import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../infrastructure/user.repository.js';
import { LoginDTO, LoginResponse, CreateUserDTO, UserWithRole } from '../domain/user.entity.js';
import { env } from '../../../infrastructure/config/env.js';

/** Every authentication failure returns this identical message. */
const GENERIC_LOGIN_ERROR = 'Invalid username or password';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async login(data: LoginDTO): Promise<LoginResponse> {
    let user = await this.userRepo.findByUsername(data.username);

    if (!user && data.username.includes('@')) {
      user = await this.userRepo.findByEmail(data.username);
    }

    // A distinct "no such user" message would let an attacker enumerate valid
    // usernames, so every failure path below returns the same generic error.
    if (!user) {
      throw new Error(GENERIC_LOGIN_ERROR);
    }

    const isActive = Boolean(user.is_active);
    const isLocked = Boolean(user.locked_until) && new Date(user.locked_until as unknown as string) > new Date();

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);

    if (!isValidPassword || !isActive || isLocked) {
      if (!isValidPassword) {
        // Compare against the post-increment count: reading the column before
        // incrementing locked the account on the 5th failure, not the 4th.
        const attempts = Number(user.failed_login_attempts ?? 0) + 1;

        if (attempts >= MAX_FAILED_ATTEMPTS && !isLocked) {
          await this.userRepo.lockUser(user.id, LOCK_MINUTES);
        } else {
          await this.userRepo.incrementFailedLogin(user.id);
        }
      }

      throw new Error(GENERIC_LOGIN_ERROR);
    }

    await this.userRepo.updateLastLogin(user.id);

    const token = jwt.sign(
      { userId: user.id, username: user.username, role_id: user.role_id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'], algorithm: 'HS256' }
    );

    const role = await this.userRepo.findRoleById(user.role_id);
    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    return {
      user: {
        ...userWithoutPassword,
        role_name: role?.name || 'unknown',
      } as Omit<typeof user, 'password_hash'> & { role_name: string },
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

  async verifyToken(token: string): Promise<jwt.JwtPayload> {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  }
}
