/**
 * @typedef {import ('../../../shared/domain/models/Frameworks.js').Frameworks} Frameworks
 * @typedef {import ('./index.js').TubeRepository} TubeRepository
 * @typedef {import ('./index.js').SkillRepository} SkillRepository
 * @typedef {import ('./index.js').ChallengeRepository} ChallengeRepository
 * @typedef {import ('./index.js').SharedVersionsRepository} SharedVersionsRepository
 * @typedef {import ('./index.js').VersionsRepository} VersionsRepository
 */

import dayjs from 'dayjs';

import { withTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { FRENCH_FRANCE, FRENCH_SPOKEN } from '../../../../shared/domain/services/locale-service.js';
import { DEFAULT_SESSION_DURATION_MINUTES } from '../../../shared/domain/constants.js';
import { Version } from '../../../shared/domain/models/Version.js';

/**
 * @param {Object} params
 * @param {Frameworks} params.scope
 * @param {SharedVersionsRepository} params.sharedVersionsRepository
 * @param {VersionsRepository} params.versionsRepository
 */
const _buildNewVersion = async ({ scope, sharedVersionsRepository, versionsRepository }) => {
  const currentVersion = await sharedVersionsRepository.findLatestByScope({ scope });

  if (!currentVersion) {
    return new Version({
      scope,
      startDate: dayjs().toDate(),
      expirationDate: null,
      assessmentDuration: DEFAULT_SESSION_DURATION_MINUTES,
      challengesConfiguration: {},
    });
  }

  const transitionDate = dayjs().toDate();

  const expiredVersion = new Version({
    ...currentVersion,
    expirationDate: transitionDate,
  });
  await versionsRepository.updateExpirationDate({ version: expiredVersion });

  return new Version({
    scope,
    startDate: transitionDate,
    expirationDate: null,
    assessmentDuration: currentVersion.assessmentDuration,
    challengesConfiguration: currentVersion.challengesConfiguration,
  });
};

/**
 * @param {Object} params
 * @param {Array<string>} params.tubeIds
 * @param {TubeRepository} params.tubeRepository
 * @param {SkillRepository} params.skillRepository
 * @param {ChallengeRepository} params.challengeRepository
 */
const _getChallengesForTubes = async ({ tubeIds, tubeRepository, skillRepository, challengeRepository }) => {
  const tubes = await tubeRepository.findActiveByRecordIds(tubeIds, FRENCH_SPOKEN);
  const skillIds = tubes.flatMap((tube) => tube.skillIds);
  const skills = await skillRepository.findActiveByRecordIds(skillIds);
  return challengeRepository.findValidatedBySkills(skills, FRENCH_FRANCE);
};

export const createCertificationVersion = withTransaction(
  /**
   * @param {Object} params
   * @param {Frameworks} params.scope
   * @param {Array<string>} params.tubeIds
   * @param {TubeRepository} params.tubeRepository
   * @param {SkillRepository} params.skillRepository
   * @param {ChallengeRepository} params.challengeRepository
   * @param {SharedVersionsRepository} params.sharedVersionsRepository
   * @param {VersionsRepository} params.versionsRepository
   */
  async ({
    scope,
    tubeIds,
    tubeRepository,
    skillRepository,
    challengeRepository,
    sharedVersionsRepository,
    versionsRepository,
  }) => {
    const version = await _buildNewVersion({ scope, sharedVersionsRepository, versionsRepository });
    const challenges = await _getChallengesForTubes({ tubeIds, tubeRepository, skillRepository, challengeRepository });
    return versionsRepository.create({ version, challenges });
  },
);
