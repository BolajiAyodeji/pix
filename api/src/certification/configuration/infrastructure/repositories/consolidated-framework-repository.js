/**
 * @typedef {import ('../../../shared/domain/models/ComplementaryCertificationKeys.js').ComplementaryCertificationKeys} ComplementaryCertificationKeys
 */
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { CertificationFrameworksChallenge } from '../../domain/models/CertificationFrameworksChallenge.js';
import { ConsolidatedFramework } from '../../domain/models/ConsolidatedFramework.js';

export async function getCurrentFrameworkByComplementaryCertificationKey({ complementaryCertificationKey }) {
  const knexConn = DomainTransaction.getConnection();

  const lastComplementaryFramework = await knexConn('certification-frameworks-challenges')
    .select('version')
    .where({ complementaryCertificationKey })
    .orderBy('version', 'desc')
    .first();

  if (!lastComplementaryFramework) {
    throw new NotFoundError(`There is no framework for complementary ${complementaryCertificationKey}`);
  }

  const currentFrameworkChallengesDTO = await knexConn('certification-frameworks-challenges')
    .select('discriminant', 'difficulty', 'challengeId', 'version', 'calibrationId', 'complementaryCertificationKey')
    .where({
      version: lastComplementaryFramework.version,
      complementaryCertificationKey,
    });

  return _toDomain({ certificationFrameworksChallengesDTO: currentFrameworkChallengesDTO });
}

export async function getFrameworkHistory({ complementaryCertificationKey }) {
  const knexConn = DomainTransaction.getConnection();

  const frameworks = await knexConn('certification-frameworks-challenges')
    .select('version')
    .distinct('version')
    .where({ complementaryCertificationKey })
    .orderBy('version', 'desc');

  return frameworks.map(({ version }) => version);
}

function _toDomain({ certificationFrameworksChallengesDTO }) {
  const { complementaryCertificationKey, version, calibrationId } = certificationFrameworksChallengesDTO[0];

  return new ConsolidatedFramework({
    complementaryCertificationKey,
    version,
    calibrationId,
    challenges: certificationFrameworksChallengesDTO.map(
      (challenge) => new CertificationFrameworksChallenge(challenge),
    ),
  });
}
