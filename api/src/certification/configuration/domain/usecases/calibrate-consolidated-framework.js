/**
 * @typedef {import ('./index.js').ActiveCalibratedChallengeRepository} ActiveCalibratedChallengeRepository
 * @typedef {import ('./index.js').FrameworkChallengesRepository} FrameworkChallengesRepository
 * @typedef {import ('./index.js').VersionsRepository} VersionsRepository
 * @typedef {import ('../models/FrameworkChallenges.js').FrameworkChallenges} FrameworkChallenges
 * @typedef {import ('../models/CertificationFrameworksChallenge.js').CertificationFrameworksChallenge} CertificationFrameworksChallenge
 * @typedef {import ('../read-models/ActiveCalibratedChallenge.js').ActiveCalibratedChallenge} ActiveCalibratedChallenge
 */

import { withTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';

export const calibrateConsolidatedFramework = withTransaction(
  /**
   * @param {Object} params
   * @param {number} params.versionId
   * @param {number} params.calibrationId
   * @param {FrameworkChallengesRepository} params.frameworkChallengesRepository
   * @param {ActiveCalibratedChallengeRepository} params.activeCalibratedChallengeRepository
   * @param {VersionsRepository} params.versionsRepository
   * @returns {Promise<void>}
   */
  async ({
    versionId,
    calibrationId,
    frameworkChallengesRepository,
    activeCalibratedChallengeRepository,
    versionsRepository,
  }) => {
    const version = await versionsRepository.getById({ id: versionId });
    const frameworkChallenges = await frameworkChallengesRepository.getByVersionId({ versionId });

    const activeCalibratedChallenges = await activeCalibratedChallengeRepository.getByComplementaryKeyAndCalibrationId({
      scope: version.scope,
      calibrationId,
    });

    _calibrateFrameworkChallenges({
      frameworkChallenges,
      activeCalibratedChallenges,
    });

    return frameworkChallengesRepository.save(frameworkChallenges);
  },
);

/**
 * @param {FrameworkChallenges} frameworkChallenges
 * @param {Array<ActiveCalibratedChallenge>} activeCalibratedChallenges
 */
const _calibrateFrameworkChallenges = ({ frameworkChallenges, activeCalibratedChallenges }) => {
  for (let source = 0, target = 0; source < activeCalibratedChallenges.length; source++, target++) {
    while (activeCalibratedChallenges[source].challengeId !== frameworkChallenges.challenges[target]?.challengeId) {
      if (!frameworkChallenges.challenges[target]) {
        throw new NotFoundError(
          `The challenge ${activeCalibratedChallenges[source].challengeId} does not exist in the framework challenges`,
        );
      }
      target++;
    }

    const frameworkChallenge = frameworkChallenges.challenges[target];
    frameworkChallenge.calibrate(activeCalibratedChallenges[source]);
  }
};
