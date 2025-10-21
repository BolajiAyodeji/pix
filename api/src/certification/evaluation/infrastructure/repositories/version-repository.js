/**
 * @typedef {import ('../../../shared/domain/constants.js').SUBSCRIPTION_TYPES} SUBSCRIPTION_TYPES
 * @typedef {import ('../../../shared/domain/errors.js').NotFoundError} NotFoundError
 * @typedef {import ('../../../shared/domain/models/Frameworks.js').Frameworks} Frameworks
 * @typedef {import ('../../../shared/domain/models/Version.js').Version} Version
 */

import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Version } from '../../../shared/domain/models/Version.js';

/**
 * @param {number} versionId
 * @returns {Promise<Version>}
 */
export const getById = async (versionId) => {
  const knexConn = DomainTransaction.getConnection();

  const versionData = await knexConn('certification_versions')
    .select('id', 'scope', 'challengesConfiguration')
    .where({ id: versionId })
    .first();

  if (!versionData) {
    throw new NotFoundError(`No certification version found for id ${versionId}`);
  }

  return _toDomain(versionData);
};

const _toDomain = ({ id, scope, challengesConfiguration }) => {
  return new Version({
    id,
    scope,
    challengesConfiguration,
  });
};
