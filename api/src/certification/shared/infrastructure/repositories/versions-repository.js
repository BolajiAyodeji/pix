import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Version } from '../../domain/models/Version.js';

/**
 * @param {Object} params
 * @param {import('../../domain/models/Frameworks.js').Frameworks} params.scope
 * @param {Date} params.reconciliationDate
 * @returns {Promise<Version>}
 */
export const getByScopeAndReconciliationDate = async ({ scope, reconciliationDate }) => {
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
    .andWhere('startDate', '<=', reconciliationDate)
    .andWhere((queryBuilder) => {
      queryBuilder.whereNull('expirationDate').orWhere('expirationDate', '>', reconciliationDate);
    })
    .orderBy('startDate', 'desc')
    .first();

  if (!versionData) {
    throw new NotFoundError('No certification framework version found for the given scope and reconciliationDate');
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
