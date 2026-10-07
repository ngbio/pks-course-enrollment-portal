import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Config } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import type { LoginRequestDto, RegisterRequestDto } from './auth.schema.js';
import { toUserResponse } from './auth.mapper.js';

export class AuthService {
  private dummyHash = bcrypt.hash('not-a-real-user-password', 12);
  constructor(
    private db: PrismaClient,
    private config: Config,
  ) {}
  async register(input: RegisterRequestDto) {
    const email = input.email.trim().toLowerCase();
    if (
      await this.db.user.findUnique({ where: { email }, select: { id: true } })
    )
      throw new AppError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng.');
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      return toUserResponse(
        await this.db.user.create({
          data: {
            fullName: input.fullName,
            email,
            passwordHash,
            role: 'STUDENT',
          },
        }),
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new AppError(409, 'EMAIL_EXISTS', 'Email đã được sử dụng.');
      throw e;
    }
  }
  async login(input: LoginRequestDto) {
    const user = await this.db.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });
    const valid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? (await this.dummyHash),
    );
    if (!user || !valid)
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Email hoặc mật khẩu không đúng.',
      );
    const token = jwt.sign({}, this.config.JWT_SECRET, {
      algorithm: 'HS256',
      subject: String(user.id),
      expiresIn: this.config.JWT_TTL_SECONDS,
      issuer: 'pks-api',
      audience: 'pks-portal',
    });
    return { user: toUserResponse(user), token };
  }
}
