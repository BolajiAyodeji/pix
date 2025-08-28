import { datamartBuffer } from '../datamart-buffer.js';

const buildCalibratedChallenge = function ({
  calibrationId,
  challengeId,
  alpha = 1.3,
  delta = 4.1,
  is_excluded = false,
  exclusion_reason,
  calibration_method = 'directe',
} = {}) {
  const values = {
    calibration_id: calibrationId,
    challenge_id: challengeId,
    alpha,
    delta,
    is_excluded,
    exclusion_reason,
    calibration_method,
  };

  return datamartBuffer.pushInsertable({
    tableName: 'data_active_calibrated_challenges',
    values,
  });
};

export { buildCalibratedChallenge };
