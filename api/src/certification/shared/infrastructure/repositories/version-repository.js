/**
 * @typedef {import ('../../domain/constants.js').SUBSCRIPTION_TYPES} SUBSCRIPTION_TYPES
 * @typedef {import ('../../domain/errors.js').NotFoundError} NotFoundError
 * @typedef {import ('../../domain/models/Frameworks.js').Frameworks} Frameworks
 * @typedef {import ('../../domain/models/Version.js').Version} Version
 */

import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { SUBSCRIPTION_TYPES } from '../../../shared/domain/constants.js';
import { Frameworks } from '../../../shared/domain/models/Frameworks.js';
import { Version } from '../../domain/models/Version.js';

/**
 * @param {number} courseId
 * @returns {Promise<Version>}
 */
export const getByCourseId = async (courseId) => {
  const knexConn = DomainTransaction.getConnection();

  const candidateSubscription = await knexConn('certification-courses')
    .select(
      'certification-candidates.reconciledAt',
      'certification-subscriptions.type as subscriptionType',
      'complementary-certifications.key as complementaryCertificationKey',
    )
    .join('certification-candidates', function () {
      this.on('certification-courses.userId', '=', 'certification-candidates.userId').andOn(
        'certification-courses.sessionId',
        '=',
        'certification-candidates.sessionId',
      );
    })
    .join(
      'certification-subscriptions',
      'certification-subscriptions.certificationCandidateId',
      'certification-candidates.id',
    )
    .leftJoin(
      'complementary-certifications',
      'certification-subscriptions.complementaryCertificationId',
      'complementary-certifications.id',
    )
    .orderBy('certification-subscriptions.type', 'DESC')
    .where('certification-courses.id', courseId)
    .first();

  if (!candidateSubscription) {
    throw new NotFoundError(`No candidate found for certification course ${courseId}`);
  }

  const scope =
    candidateSubscription.subscriptionType === SUBSCRIPTION_TYPES.CORE
      ? Frameworks.CORE
      : candidateSubscription.complementaryCertificationKey;

  const versionData = await knexConn('certification_versions')
    .select('id', 'scope', 'challengesConfiguration')
    .where({ scope })
    .andWhere('startDate', '<=', candidateSubscription.reconciledAt)
    .andWhere((queryBuilder) => {
      queryBuilder.whereNull('expirationDate').orWhere('expirationDate', '>', candidateSubscription.reconciledAt);
    })
    .orderBy('startDate', 'desc')
    .first();

  if (!versionData) {
    throw new NotFoundError(
      `No certification version found for scope ${scope} and reconciliation date ${candidateSubscription.reconciledAt}`,
    );
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
