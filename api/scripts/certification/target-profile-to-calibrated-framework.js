import { knex } from '../../db/knex-database-connection.js';
import { usecases } from '../../src/certification/configuration/domain/usecases/index.js';
import { ComplementaryCertificationKeys } from '../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { Script } from '../../src/shared/application/scripts/script.js';
import { ScriptRunner } from '../../src/shared/application/scripts/script-runner.js';

export class TargetProfileToCalibratedFrameworkScript extends Script {
  constructor() {
    super({
      description: 'Create a new version of  consolidated framework from a target profile',
      permanent: false,
      options: {
        complementaryCertificationKey: {
          type: 'string',
          describe: 'Complementary Certification key',
          requiresArg: true,
        },
        targetProfileId: {
          type: 'number',
          describe: 'Target profile ID',
          requiresArg: true,
        },
      },
    });
  }

  async handle({ options, logger }) {
    logger.info(`Check ${options.complementaryCertificationKey} existence in the domain`);
    if (!Object.values(ComplementaryCertificationKeys).includes(options.complementaryCertificationKey)) {
      throw new Error('The certification key is missing');
    }

    logger.info(`Retrieve target-profile #${options.targetProfileId} tubes`);
    const tubeIds = await knex('target-profile_tubes')
      .pluck('tubeId')
      .where('targetProfileId', options.targetProfileId);

    if (tubeIds?.length < 1) {
      throw new RangeError('This target profile does not hold any tubes');
    }

    logger.info(`Handle retrieving tubes to create ${tubeIds.length} new certification frameworks challenges`);
    await usecases.createCertificationVersion({
      scope: options.complementaryCertificationKey,
      tubeIds,
    });
  }
}

await ScriptRunner.execute(import.meta.url, TargetProfileToCalibratedFrameworkScript);
