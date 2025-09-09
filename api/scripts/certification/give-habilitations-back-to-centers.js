import Joi from 'joi';

import { knex } from '../../db/knex-database-connection.js';
import { csvFileParser } from '../../src/shared/application/scripts/parsers.js';
import { Script } from '../../src/shared/application/scripts/script.js';
import { ScriptRunner } from '../../src/shared/application/scripts/script-runner.js';

const columnSchemas = [
  { name: 'complementaryCertificationId', schema: Joi.number().required() },
  { name: 'certificationCenterId', schema: Joi.number().required() },
];

export class GiveHabilitationsBackToCenters extends Script {
  constructor() {
    super({
      description: 'give back to centers their habilitations',
      permanent: false,
      options: {
        file: {
          type: 'string',
          describe: 'CSV File with complementaryCertificationId and certificationCenterId columns',
          demandOption: true,
          coerce: csvFileParser(columnSchemas),
        },
        dryRun: {
          type: 'boolean',
          describe: 'Run the script without making any database changes',
          default: true,
        },
      },
    });
  }

  async handle({ logger, options }) {
    const { file: csvData, dryRun } = options;

    logger.info(`Processing ${csvData.length} records from CSV file`);

    if (csvData.length === 0) {
      logger.info('No records to process');
      return { processed: 0, updated: 0 };
    }

    const trx = await knex.transaction();

    try {
      const updateResult = await trx.batchInsert('complementary-certification-habilitations', csvData).returning('id');

      if (dryRun) {
        await trx.rollback();
        logger.info(`Dry run: ${updateResult.length} records would be created`);

        return { processed: csvData.length, updated: 0 };
      }

      await trx.commit();
      logger.info(`Successfully created ${updateResult} complementary-certification-habilitations records`);
      logger.info(`Records processed: ${csvData.length}`);

      return {
        processed: csvData.length,
        updated: updateResult.length,
      };
    } catch (error) {
      await trx.rollback();
      logger.error('Error during batch creation:', error.message);
      throw error;
    }
  }
}

await ScriptRunner.execute(import.meta.url, GiveHabilitationsBackToCenters);
