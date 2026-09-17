import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '@infrastructure/config/jwt.config';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (
        jwt: ConfigType<typeof jwtConfig>,
      ): JwtModuleOptions => ({
        secret: jwt.secret,
        signOptions: {
          expiresIn:
            jwt.expiresIn as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class JwtInfraModule {}
