import {
  BadRequestException,
  ParseIntPipe,
  PipeTransform,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * 对密码进行 bcrypt 哈希
 * 用异步 API：bcrypt 计算约需百毫秒级，同步版本会阻塞事件循环
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码（bcrypt）
 */
export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
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

class MaxValuePipe implements PipeTransform<number, number> {
  constructor(
    private readonly name: string,
    private readonly max: number,
  ) {}

  transform(value: number) {
    if (value > this.max) {
      throw new BadRequestException(`${this.name} 不能超过 ${this.max}`);
    }
    return value;
  }
}

/**
 * 生成一个上限校验 Pipe（用于 pageSize 等需要限制上限的数字参数）
 */
export function generateMaxValuePipe(name: string, max: number) {
  return new MaxValuePipe(name, max);
}
