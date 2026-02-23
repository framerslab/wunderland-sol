/**
 * @file immutability.module.ts
 * @description Shared providers for immutability / verifiability features.
 */

import { Module } from '@nestjs/common';
import { PromptRevisionsService } from './prompt-revisions.service.js';

@Module({
  providers: [PromptRevisionsService],
  exports: [PromptRevisionsService],
})
export class ImmutabilityModule {}

