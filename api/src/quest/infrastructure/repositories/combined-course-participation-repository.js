import { knex } from '../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { fetchPage } from '../../../shared/infrastructure/utils/knex-utils.js';
import { CombinedCourseParticipation } from '../../domain/models/CombinedCourseParticipation.js';
import {
  OrganizationLearnerParticipationStatuses,
  OrganizationLearnerParticipationTypes,
} from '../../domain/models/OrganizationLearnerParticipation.js';

export const save = async function ({ organizationLearnerId, combinedCourseId }) {
  const knexConnection = DomainTransaction.getConnection();

  await knexConnection('organization_learner_participations')
    .insert({
      organizationLearnerId,
      status: OrganizationLearnerParticipationStatuses.STARTED,
      type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
      referenceId: combinedCourseId,
    })
    .returning('id');
};

export const getByUserId = async function ({ userId, combinedCourseId }) {
  const knexConnection = DomainTransaction.getConnection();

  const questParticipations = await knexConnection('organization_learner_participations')
    .select(
      'organization_learner_participations.id',
      'organizationLearnerId',
      'firstName',
      'lastName',
      'organization_learner_participations.status',
      'organization_learner_participations.createdAt',
      'organization_learner_participations.updatedAt',
      'organization_learner_participations.referenceId',
    )
    .join(
      'view-active-organization-learners',
      'view-active-organization-learners.id',
      '=',
      'organization_learner_participations.organizationLearnerId',
    )
    .where({
      'view-active-organization-learners.userId': userId,
      'organization_learner_participations.referenceId': combinedCourseId.toString(),
      'organization_learner_participations.type': OrganizationLearnerParticipationTypes.COMBINED_COURSE,
    });
  if (questParticipations.length === 0) {
    throw new NotFoundError(
      `CombinedCourseParticipation introuvable pour l'utilisateur d'id ${userId} et au parcours d'id ${combinedCourseId}`,
    );
  }
  return new CombinedCourseParticipation(questParticipations[0]);
};

export const findUserIdsById = async function ({ combinedCourseId, page }) {
  const knexConnection = DomainTransaction.getConnection();

  const queryBuilder = knexConnection('combined_courses')
    .select('users.id')
    .join('organization_learner_participations', function () {
      this.on(
        knex.raw('CAST(organization_learner_participations."referenceId" AS INTEGER)'),
        '=',
        'combined_courses.id',
      );
    })
    .join(
      'view-active-organization-learners',
      'view-active-organization-learners.id',
      'organization_learner_participations.organizationLearnerId',
    )
    .join('users', 'users.id', 'view-active-organization-learners.userId')
    .where('combined_courses.id', combinedCourseId);

  const { results, pagination } = await fetchPage({ queryBuilder, paginationParams: page });
  return {
    userIds: results.map((result) => result.id),
    meta: pagination,
  };
};

export const update = async function ({ combinedCourseParticipation }) {
  const knexConnection = DomainTransaction.getConnection();
  const updatedRow = await knexConnection('organization_learner_participations')
    .where({ id: combinedCourseParticipation.id })
    .update({
      updatedAt: combinedCourseParticipation.updatedAt,
      status: combinedCourseParticipation.status,
      completedAt: combinedCourseParticipation.completedAt,
    })
    .returning('*');
  return new CombinedCourseParticipation(updatedRow[0]);
};

/**
 * @param {[number]} combinedCourseIds
 * @returns {Promise<[CombinedCourseParticipation]>}
 */
export const findByCombinedCourseIds = async ({ combinedCourseIds, page }) => {
  const knexConnection = DomainTransaction.getConnection();
  const queryBuilder = knexConnection('combined_courses')
    .select(
      'organization_learner_participations.id',
      'firstName',
      'lastName',
      'organization_learner_participations.status',
      'organizationLearnerId',
      'organization_learner_participations.createdAt',
      'organization_learner_participations.updatedAt',
    )
    .join('organization_learner_participations', function () {
      this.on(
        knex.raw('CAST(organization_learner_participations."referenceId" AS INTEGER)'),
        '=',
        'combined_courses.id',
      );
    })
    .join(
      'view-active-organization-learners',
      'view-active-organization-learners.id',
      'organization_learner_participations.organizationLearnerId',
    )
    .whereIn('combined_courses.id', combinedCourseIds)
    .orderBy([
      { column: 'lastName', order: 'asc' },
      { column: 'firstName', order: 'asc' },
    ]);
  const { results, pagination } = await fetchPage({ queryBuilder, paginationParams: page });
  return {
    combinedCourseParticipations: results.map((participation) => new CombinedCourseParticipation(participation)),
    meta: { ...pagination },
  };
};
