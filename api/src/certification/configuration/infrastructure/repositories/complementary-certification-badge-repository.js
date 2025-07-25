import { knex } from '../../../../../db/knex-database-connection.js';
import { Badge } from '../../../../evaluation/domain/models/Badge.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';

export const getAllIdsByTargetProfileId = async function ({ targetProfileId }) {
  const knexConn = DomainTransaction.getConnection();

  const complementaryCertificationBadgesIds = await knexConn('badges')
    .select('complementary-certification-badges')
    .leftJoin('complementary-certification-badges', 'complementary-certification-badges.badgeId', 'badges.id')
    .leftJoin('target-profiles', 'target-profiles.id', 'badges.targetProfileId')
    .where({ targetProfileId })
    .andWhere('complementary-certification-badges.detachedAt', null)
    .pluck('complementary-certification-badges.id');
  return complementaryCertificationBadgesIds;
};

export const detachByIds = async function ({ complementaryCertificationBadgeIds }) {
  const knexConn = DomainTransaction.getConnection();
  const now = new Date();
  return knexConn('complementary-certification-badges')
    .whereIn('id', complementaryCertificationBadgeIds)
    .update({ detachedAt: now });
};

export const attach = async function ({ complementaryCertificationBadges }) {
  const knexConn = DomainTransaction.getConnection();
  const createdAt = new Date();

  for (const complementaryCertificationBadge of complementaryCertificationBadges) {
    await knexConn('complementary-certification-badges').insert({
      ...complementaryCertificationBadge,
      createdAt,
    });
  }
};

export const findAttachableBadgesByIds = async function ({ ids }) {
  const badges = await knex
    .from('badges')
    .whereIn('badges.id', ids)
    .andWhere('badges.isCertifiable', true)
    .whereNotExists(
      knex
        .select(1)
        .from('complementary-certification-badges')
        .whereRaw('"complementary-certification-badges"."badgeId" = "badges"."id"'),
    );

  return badges.map((badge) => {
    return new Badge(badge);
  });
};
