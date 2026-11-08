import { Module } from '@nestjs/common';
import { CredentialsModule } from '../credentials/credentials.module.js';
import { EmailIntegrationController } from './email.controller.js';
import { EmailIntegrationService } from './email.service.js';
import { EmailUnsubscribeController } from './email-unsubscribe.controller.js';
import { EmailUnsubscribeService } from './email-unsubscribe.service.js';

@Module({
  imports: [CredentialsModule],
  controllers: [EmailIntegrationController, EmailUnsubscribeController],
  providers: [EmailIntegrationService, EmailUnsubscribeService],
})
export class EmailIntegrationModule {}
