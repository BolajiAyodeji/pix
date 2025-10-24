/**
 * @typedef {import ('../../../shared/domain/models/ComplementaryCertificationKeys.js').ComplementaryCertificationKeys} ComplementaryCertificationKeys
 */
import { knex as datamartKnex } from '../../../../../datamart/knex-database-connection.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { ActiveCalibratedChallenge } from '../../domain/read-models/ActiveCalibratedChallenge.js';

/**
 * @param {Object} params
 * @param {ComplementaryCertificationKeys} params.scope
 * @param {number} params.calibrationId
 * @returns {Promise<Array<ActiveCalibratedChallenge>>}
 * @throws {NotFoundError}
 */
export async function getByComplementaryKeyAndCalibrationId({ scope, calibrationId }) {
  const activeCalibratedChallengesDTO = await datamartKnex('data_active_calibrated_challenges')
    .select('scope', 'alpha as discriminant', 'delta as difficulty', 'challenge_id as challengeId')
    .innerJoin('data_calibrations', 'data_active_calibrated_challenges.calibration_id', 'data_calibrations.id')
    .where({
      calibration_id: calibrationId,
      scope,
      status: 'VALIDATED',
    })
    .orderBy('challengeId');

  if (activeCalibratedChallengesDTO.length === 0) {
    throw new NotFoundError(`Calibration does not exist`);
  }

  return activeCalibratedChallengesDTO.map((activeCalibratedChallenge) => _toDomain({ activeCalibratedChallenge }));
}

function _toDomain({ activeCalibratedChallenge }) {
  return new ActiveCalibratedChallenge(activeCalibratedChallenge);
}
