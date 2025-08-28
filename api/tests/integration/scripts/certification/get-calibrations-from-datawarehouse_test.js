import fs from 'node:fs';

import { GetCalibrationsFromDatawarehouse } from '../../../../scripts/certification/get-calibrations-from-datawarehouse.js';
import { datamartBuilder, expect } from '../../../test-helper.js';

describe('Integration | Scripts | Certification | get calibrations from datawarehouse', function () {
  it('should return data to put in file', async function () {
    // given
    const filePath = './ouput.json';
    const calibrationId = 123;
    const calibration = datamartBuilder.factory.buildCalibration({
      id: calibrationId,
      scope: 'COEUR',
      status: 'VALIDATED',
    });
    await datamartBuilder.commit();
    const expectedOutput = `id, scope, status, calibration_date, updated_at
${calibrationId},${calibration.scope},${calibration.status},${calibration.calibration_date},${calibration.updated_at}`;

    // when
    const getCalibrationsFromDatawarehouse = new GetCalibrationsFromDatawarehouse();
    await getCalibrationsFromDatawarehouse.handle({ options: { filePath } });

    // then
    const resultFileContent = fs.readFileSync(filePath, 'utf-8');
    expect(resultFileContent).to.deep.equal(expectedOutput);
  });
});
