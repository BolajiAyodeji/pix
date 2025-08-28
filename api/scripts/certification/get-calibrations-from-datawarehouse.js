import fs from 'node:fs';

import { knex as datamartKnex } from '../../datamart/knex-database-connection.js';
import { Script } from '../../src/shared/application/scripts/script.js';
import { ScriptRunner } from '../../src/shared/application/scripts/script-runner.js';

export class GetCalibrationsFromDatawarehouse extends Script {
  constructor() {
    super({
      description: '[NOT FOR PROD] Sync datamart with challenges from certification-courses',
      permanent: false,
      options: {},
    });

    this.totalNumberOfUpdatedRows = 0;
  }

  async handle({ options, logger }) {
    this.logger = logger;
    const calibrations = await datamartKnex('data_calibrations');
    let outputContent = 'id, scope, status, calibration_date, updated_at';
    calibrations.forEach((calibration) => {
      outputContent += `\n${calibration.id},${calibration.scope},${calibration.status},${calibration.calibration_date},${calibration.updated_at}`;
    });
    fs.writeFileSync(options.filePath, outputContent);
  }
}

await ScriptRunner.execute(import.meta.url, GetCalibrationsFromDatawarehouse);
