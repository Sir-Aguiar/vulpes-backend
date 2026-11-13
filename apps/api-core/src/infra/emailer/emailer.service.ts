import { Injectable, Logger } from '@nestjs/common';
import 'dotenv/config';
import { createTransport, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailerService {
  private readonly logger = new Logger(EmailerService.name);
  private readonly defaultOptions: Mail.Options;
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = createTransport({
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
    });

    this.defaultOptions = {
      from: {
        name: 'Vulpes',
        address: process.env.EMAIL_USER,
      },
    };
  }

  async sendEmail(options: Omit<Mail.Options, 'from'>): Promise<void> {
    try {
      await this.transporter.sendMail({ ...this.defaultOptions, ...options });
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }
}
