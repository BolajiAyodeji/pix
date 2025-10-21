/**
 * @typedef {import('../../domain/models/Frameworks.js').Frameworks} Frameworks
 */

import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { Version } from '../../domain/models/Version.js';

/**
 * @param {Object} params
 * @param {Frameworks} params.scope
 * @returns {Promise<Version|null>}
 */
export const findLatestByScope = async ({ scope }) => {
  const knexConn = DomainTransaction.getConnection();

  const versionData = await knexConn('certification_versions')
    .select(
      'id',
      'scope',
      'startDate',
      'expirationDate',
      'assessmentDuration',
      'globalScoringConfiguration',
      'competencesScoringConfiguration',
      'challengesConfiguration',
    )
    .where({ scope })
    .whereNull('expirationDate')
    .first();

  if (!versionData) {
    return null;
  }

  return _toDomain(versionData);
};

const _toDomain = ({
  id,
  scope,
  startDate,
  expirationDate,
  assessmentDuration,
  globalScoringConfiguration,
  competencesScoringConfiguration,
  challengesConfiguration,
}) => {
  return new Version({
    id,
    scope,
    startDate,
    expirationDate,
    assessmentDuration,
    globalScoringConfiguration,
    competencesScoringConfiguration,
    challengesConfiguration,
  });
};
