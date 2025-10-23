/**
 * @typedef {import('../../../shared/domain/models/Frameworks.js').Frameworks} Frameworks
 * @typedef {import('../../domain/models/Version.js').Version} Version
 * @typedef {import('../../../../shared/domain/models/Challenge.js').Challenge} Challenge
 */
import { knex } from '../../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { Version } from '../../domain/models/Version.js';

/**
 * @param {Object} params
 * @param {Frameworks} params.scope
 * @returns {Promise<Version|null>}
 */
export async function findActiveByScope({ scope }) {
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
}

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
export async function update({ version }) {
  const knexConn = DomainTransaction.getConnection();

  await knexConn('certification_versions').where({ id: version.id }).update({ expirationDate: version.expirationDate });
}

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
