import _ from 'lodash';

import { knex } from '../../../../db/knex-database-connection.js';
import { KnowledgeElementCollection } from '../../../prescription/shared/domain/models/KnowledgeElementCollection.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { KnowledgeElement } from '../../../shared/domain/models/KnowledgeElement.js';

const tableName = 'knowledge-elements';

const saveForCampaignParticipation = async function ({
  knowledgeElements,
  campaignParticipationId,
  campaignApi,
  knowledgeElementSnapshotAPI,
}) {
  const knexConn = DomainTransaction.getConnection();
  const campaign = await campaignApi.getByCampaignParticipationId(campaignParticipationId);
  if (!campaign) {
    throw new Error(`Invalid campaign participation ${campaignParticipationId}`);
  }
  if (campaign.isAssessment) {
    const knowledgeElementsToSave = knowledgeElements.map((ke) => _.omit(ke, ['id', 'createdAt']));
    await knex
      .batchInsert(tableName, knowledgeElementsToSave)
      .transacting(knexConn.isTransaction ? knexConn : null)
      .returning('*');
    return;
  } else if (campaign.isExam) {
    const currentSnapshot = await knowledgeElementSnapshotAPI.getByParticipation(campaignParticipationId);
    const createdAt = new Date();
    const previousKnowledgeElements = currentSnapshot.knowledgeElements ?? [];
    await knowledgeElementSnapshotAPI.save({
      userId: knowledgeElements[0].userId,
      knowledgeElements: previousKnowledgeElements.concat(
        knowledgeElements.map(
          (ke) =>
            new KnowledgeElement({
              ...ke,
              createdAt,
            }),
        ),
      ),
      campaignParticipationId,
    });
    return;
  }
  throw new Error(`Saving knowledge-elements for campaign of type ${campaign.type} not implemented`);
};

const findUniqByUserIdForCampaignParticipation = async function ({
  userId,
  campaignParticipationId,
  limitDate,
  knowledgeElementSnapshotAPI,
  campaignApi,
}) {
  const campaign = await campaignApi.getByCampaignParticipationId(campaignParticipationId);
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

const findUniqByUserId = function ({ userId, limitDate, skillIds }) {
  return findAssessedByUserIdAndLimitDateQuery({ userId, limitDate, skillIds });
};

const findUniqByUserIdAndCompetenceId = async function ({ userId, competenceId }) {
  const knowledgeElements = await findAssessedByUserIdAndLimitDateQuery({ userId });
  return knowledgeElements.filter((knowledgeElement) => knowledgeElement.competenceId === competenceId);
};

async function findAssessedByUserIdAndLimitDateQuery({ userId, limitDate, skillIds }) {
  const knowledgeElementRows = await _findByUserIdAndLimitDateQuery({ userId, limitDate, skillIds });

  const keCollection = new KnowledgeElementCollection(
    knowledgeElementRows.map((knowledgeElementRow) => new KnowledgeElement(knowledgeElementRow)),
  );
  return keCollection.latestUniqNonResetKnowledgeElements;
}

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

const batchSave = async function ({ knowledgeElements }) {
  const knexConn = DomainTransaction.getConnection();
  const knowledgeElementsToSave = knowledgeElements.map((ke) => _.omit(ke, ['id', 'createdAt']));
  const savedKnowledgeElements = await knex
    .batchInsert(tableName, knowledgeElementsToSave)
    .transacting(knexConn.isTransaction ? knexConn : null)
    .returning('*');
  return savedKnowledgeElements.map((ke) => new KnowledgeElement(ke));
};

export {
  batchSave,
  findUniqByUserId,
  findUniqByUserIdAndCompetenceId,
  findUniqByUserIdForCampaignParticipation,
  saveForCampaignParticipation,
};
