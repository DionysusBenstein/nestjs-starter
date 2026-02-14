import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE } from './constants/mail.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {} 
