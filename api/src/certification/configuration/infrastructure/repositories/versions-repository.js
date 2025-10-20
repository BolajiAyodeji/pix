/**
 * @typedef {import('../../../shared/domain/models/Version.js').Version} Version
 * @typedef {import('../../../../shared/domain/models/Challenge.js').Challenge} Challenge
 */
import { knex } from '../../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';

/**
 * @param {Object} params
 * @param {Version} params.version
 * @param {Array<Challenge>} params.challenges
 * @returns {Promise<number>} versionId
 */
export async function create({ version, challenges }) {
  const knexConn = DomainTransaction.getConnection();

  const [{ id }] = await knexConn('certification_versions')
    .insert({
      scope: version.scope,
      startDate: version.startDate,
      expirationDate: version.expirationDate,
      assessmentDuration: version.assessmentDuration,
      globalScoringConfiguration: version.globalScoringConfiguration
        ? JSON.stringify(version.globalScoringConfiguration)
        : null,
      competencesScoringConfiguration: version.competencesScoringConfiguration
        ? JSON.stringify(version.competencesScoringConfiguration)
        : null,
      challengesConfiguration: JSON.stringify(version.challengesConfiguration),
    })
    .returning('id');

  const challengesDTO = challenges.map((challenge) => ({
    complementaryCertificationKey: version.scope,
    challengeId: challenge.id,
    version: String(id),
    versionId: id,
  }));

  await knex
    .batchInsert('certification-frameworks-challenges', challengesDTO)
    .transacting(knexConn.isTransaction ? knexConn : null);

  return id;
}

/**
 * @param {Object} params
 * @param {Version} params.version
 * @returns {Promise<void>}
 */
export async function updateExpirationDate({ version }) {
  const knexConn = DomainTransaction.getConnection();

  await knexConn('certification_versions').where({ id: version.id }).update({ expirationDate: version.expirationDate });
}
