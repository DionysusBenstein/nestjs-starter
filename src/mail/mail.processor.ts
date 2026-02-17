import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailQueueJobName } from './enums/mail-queue-job-name.enum';
import { Logger } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

type MailJobData =
  | { email: string; resetUrl: string }
  | { email: string; code: string };

@Processor('email')
export class MailProcessor extends WorkerHost {
  private readonly _logger = new Logger(MailProcessor.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    super();
    const transportConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE'),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    };

    this.transporter = createTransport(transportConfig);

    delete transportConfig.auth.pass;
    this._logger.debug('Mail transport initialized', transportConfig);
  }

  async process(job: Job<MailJobData>): Promise<void> {
    switch (job.name) {
      case MailQueueJobName.SendPasswordResetEmail: {
        const { email, resetUrl } = job.data as { email: string; resetUrl: string };
        await this.sendPasswordResetEmail(email, resetUrl);
        break;
      }
      case MailQueueJobName.SendVerificationCodeEmail: {
        const { email, code } = job.data as { email: string; code: string };
        await this.sendVerifyUserEmail(email, code);
        break;
      }
    }
  }

  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    const templatePath = path.join(process.cwd(), 'src', 'mail', 'templates', `${templateName}.hbs`);
    const template = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(template);
  }

  private async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      this._logger.debug(`Processor: ${MailQueueJobName.SendPasswordResetEmail} - ${email} - ${resetUrl}`);
      const template = await this.loadTemplate('password-reset');
      const html = template({ resetUrl });

      const response = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: email,
        subject: 'Password Reset',
        html,
      });

      this._logger.debug('Transport response:', response);
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async sendVerifyUserEmail(email: string, code: string): Promise<void> {
    try {
      this._logger.debug(`Processor: ${MailQueueJobName.SendVerificationCodeEmail} - ${email} - ${code}`);
      const template = await this.loadTemplate('verify-user');
      const html = template({ code });

      const response = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: email,
        subject: 'Verification Code',
        html,
      });

      this._logger.debug('Transport response:', response);
    } catch (error) {
      this._logger.error(error);
    }
  }
}
