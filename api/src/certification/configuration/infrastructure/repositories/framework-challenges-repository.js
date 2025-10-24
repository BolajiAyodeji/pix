import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { CertificationFrameworksChallenge } from '../../domain/models/CertificationFrameworksChallenge.js';
import { FrameworkChallenges } from '../../domain/models/FrameworkChallenges.js';

/**
 * @param {Object} params
 * @param {number} params.versionId
 * @returns {Promise<FrameworkChallenges>}
 * @throws {NotFoundError}
 */
export async function getByVersionId({ versionId }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationFrameworksChallengesDTO = await knexConn('certification-frameworks-challenges')
    .select('discriminant', 'difficulty', 'challengeId', 'versionId')
    .where({ versionId })
    .orderBy('challengeId');

  if (certificationFrameworksChallengesDTO.length === 0) {
    throw new NotFoundError('Framework challenges do not exist for this version');
  }

  return _toDomain({ certificationFrameworksChallengesDTO });
}

/**
 * @param {FrameworkChallenges} frameworkChallenges
 * @returns {Promise<void>}
 */
export async function save(frameworkChallenges) {
  const knexConn = DomainTransaction.getConnection();

  for (const { discriminant, difficulty, challengeId } of frameworkChallenges.challenges) {
    await knexConn('certification-frameworks-challenges')
      .update({
        discriminant,
        difficulty,
      })
      .where({
        versionId: frameworkChallenges.versionId,
        challengeId,
      });
  }
}

function _toDomain({ certificationFrameworksChallengesDTO }) {
  const { versionId } = certificationFrameworksChallengesDTO[0];

  return new FrameworkChallenges({
    versionId,
    challenges: certificationFrameworksChallengesDTO.map(
      (challenge) => new CertificationFrameworksChallenge(challenge),
    ),
  });
}
