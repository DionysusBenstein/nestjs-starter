import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MailQueueJobName } from './enums/mail-queue-job-name.enum';

@Injectable()
export class MailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  public async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.emailQueue.add(MailQueueJobName.SendPasswordResetEmail, { email, resetUrl });
  }

  public async sendVerificationCodeEmail(email: string, code: string) {
    await this.emailQueue.add(MailQueueJobName.SendVerificationCodeEmail, { email, code });
  }
}
