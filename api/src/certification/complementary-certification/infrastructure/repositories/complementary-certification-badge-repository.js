import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';

const isRelatedToCertification = async function (badgeId) {
  const knexConn = DomainTransaction.getConnection();
  const complementaryCertificationBadge = await knexConn('complementary-certification-badges')
    .where({ badgeId })
    .first();
  return !!complementaryCertificationBadge;
};

export { isRelatedToCertification };
