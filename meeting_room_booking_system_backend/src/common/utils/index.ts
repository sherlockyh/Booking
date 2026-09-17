import { BadRequestException, ParseIntPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

const SALT_ROUNDS = 10;

/**
 * 对密码进行 bcrypt 哈希
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * 验证密码（bcrypt）
 */
export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * md5加密（仅保留用于历史参考，不再用于密码存储）
 */
export function md5(value: string) {
  return createHash('md5').update(value).digest('hex');
}

/**
 * 生成一个 ParseIntPipe
 * @param name
 * @returns
 */
export function generateParseIntPipe(name: string) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' 应该传数字');
    },
  });
}
