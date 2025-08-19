import _ from 'lodash';

import { knex } from '../../../../db/knex-database-connection.js';
import { KnowledgeElementCollection } from '../../../prescription/shared/domain/models/KnowledgeElementCollection.js';
import { DomainTransaction } from '../../domain/DomainTransaction.js';
import { KnowledgeElement } from '../../domain/models/KnowledgeElement.js';

const tableName = 'knowledge-elements';

function _findByUserIdAndLimitDateQuery({ userId, limitDate, skillIds = [] }) {
  const knexConn = DomainTransaction.getConnection();
  return knexConn(tableName).where((qb) => {
    qb.where({ userId });
    if (limitDate) {
      qb.where('createdAt', '<', limitDate);
    }
    if (skillIds.length) {
      qb.whereIn('skillId', skillIds);
    }
  });
}

async function findAssessedByUserIdAndLimitDateQuery({ userId, limitDate, skillIds }) {
  const knowledgeElementRows = await _findByUserIdAndLimitDateQuery({ userId, limitDate, skillIds });

  const keCollection = new KnowledgeElementCollection(
    knowledgeElementRows.map((knowledgeElementRow) => new KnowledgeElement(knowledgeElementRow)),
  );
  return keCollection.latestUniqNonResetKnowledgeElements;
}

const findUniqByUserIds = async function ({ userIds }) {
  const results = [];
  for (const userId of userIds) {
    const knowledgeElements = await findAssessedByUserIdAndLimitDateQuery({
      userId,
    });

    results.push({ userId, knowledgeElements });
  }
  return results;
};

const batchSave = async function ({ knowledgeElements }) {
  const knexConn = DomainTransaction.getConnection();
  const knowledgeElementsToSave = knowledgeElements.map((ke) => _.omit(ke, ['id', 'createdAt']));
  const savedKnowledgeElements = await knex
    .batchInsert(tableName, knowledgeElementsToSave)
    .transacting(knexConn.isTransaction ? knexConn : null)
    .returning('*');
  return savedKnowledgeElements.map((ke) => new KnowledgeElement(ke));
};

const findUniqByUserId = function ({ userId, limitDate, skillIds }) {
  return findAssessedByUserIdAndLimitDateQuery({ userId, limitDate, skillIds });
};

const findUniqByUserIdAndAssessmentId = async function ({ userId, assessmentId }) {
  const query = _findByUserIdAndLimitDateQuery({ userId });
  const knowledgeElementRows = await query.where({ assessmentId });

  const keCollection = new KnowledgeElementCollection(
    knowledgeElementRows.map((knowledgeElementRow) => new KnowledgeElement(knowledgeElementRow)),
  );
  return keCollection.latestUniqNonResetKnowledgeElements;
};

const findUniqByUserIdGroupedByCompetenceId = async function ({ userId, limitDate }) {
  const knowledgeElements = await findUniqByUserId({ userId, limitDate });
  return _.groupBy(knowledgeElements, 'competenceId');
};

const findInvalidatedAndDirectByUserId = async function ({ userId }) {
  const knexConn = DomainTransaction.getConnection();
  const invalidatedKnowledgeElements = await knexConn(tableName)
    .where({
      userId,
      status: KnowledgeElement.StatusType.INVALIDATED,
      source: KnowledgeElement.SourceType.DIRECT,
    })
    .orderBy('createdAt', 'desc');

  if (!invalidatedKnowledgeElements.length) {
    return [];
  }

  return invalidatedKnowledgeElements.map(
    (invalidatedKnowledgeElement) => new KnowledgeElement(invalidatedKnowledgeElement),
  );
};

const findUniqByUserIdForCampaignParticipation = async function ({
  userId,
  campaignParticipationId,
  limitDate,
  knowledgeElementSnapshotAPI,
  campaignsAPI,
}) {
  const campaign = await campaignsAPI.getByCampaignParticipationId(campaignParticipationId);
  if (!campaign) {
    return null;
  }
  if (campaign.isProfilesCollection || campaign.isAssessment) {
    return findUniqByUserId({ userId, limitDate });
  } else if (campaign.isExam) {
    const snapshot = await knowledgeElementSnapshotAPI.getByParticipation(campaignParticipationId);
    if (!snapshot.knowledgeElements) {
      return [];
    }
    return snapshot.knowledgeElements.map((ke) => new KnowledgeElement(ke));
  }
  return null;
};

export {
  batchSave,
  findAssessedByUserIdAndLimitDateQuery,
  findInvalidatedAndDirectByUserId,
  findUniqByUserId,
  findUniqByUserIdAndAssessmentId,
  findUniqByUserIdForCampaignParticipation,
  findUniqByUserIdGroupedByCompetenceId,
  findUniqByUserIds,
};
