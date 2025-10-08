import { CombinedCourseParticipationStatuses } from '../../../prescription/shared/domain/constants.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { fetchPage } from '../../../shared/infrastructure/utils/knex-utils.js';
import { CombinedCourseParticipation } from '../../domain/models/CombinedCourseParticipation.js';
import {
  OrganizationLearnerParticipationStatuses,
  OrganizationLearnerParticipationTypes,
} from '../../domain/models/OrganizationLearnerParticipation.js';

export const save = async function ({ organizationLearnerId, questId, combinedCourseId }) {
  const knexConnection = DomainTransaction.getConnection();

  const existingcombinedCourse = await knexConnection('combined_course_participations')
    .where({ questId, organizationLearnerId })
    .first();

  if (existingcombinedCourse) return;

  const [{ id: organizationLearnerParticipationId }] = await knexConnection('organization_learner_participations')
    .insert({
      organizationLearnerId,
      status: OrganizationLearnerParticipationStatuses.STARTED,
      type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
    })
    .returning('id');

  await knexConnection('combined_course_participations').insert({
    questId,
    combinedCourseId,
    organizationLearnerId,
    organizationLearnerParticipationId,
  });
};

export const getByUserId = async function ({ userId, questId }) {
  const knexConnection = DomainTransaction.getConnection();

  const questParticipations = await knexConnection('combined_course_participations')
    .select(
      'combined_course_participations.id',
      'questId',
      'organizationLearnerId',
      'combined_course_participations.status',
      'combined_course_participations.createdAt',
      'combined_course_participations.updatedAt',
      'combined_course_participations.organizationLearnerParticipationId',
    )
    .join(
      'view-active-organization-learners',
      'view-active-organization-learners.id',
      '=',
      'combined_course_participations.organizationLearnerId',
    )
    .where({
      'view-active-organization-learners.userId': userId,
      questId,
    });
  if (questParticipations.length === 0) {
    throw new NotFoundError(
      `CombinedCourseParticipation introuvable pour l'utilisateur d'id ${userId} et la quête d'id ${questId}`,
    );
  }

  return new CombinedCourseParticipation(questParticipations[0]);
};

export const update = async function ({ combinedCourseParticipation }) {
  const knexConnection = DomainTransaction.getConnection();
  if (combinedCourseParticipation.organizationLearnerParticipationId) {
    await knexConnection('organization_learner_participations')
      .where({ id: combinedCourseParticipation.organizationLearnerParticipationId })
      .update({
        status: combinedCourseParticipation.status,
        updatedAt: combinedCourseParticipation.updatedAt,
        completedAt:
          combinedCourseParticipation.status === CombinedCourseParticipationStatuses.COMPLETED
            ? combinedCourseParticipation.updatedAt
            : null,
      });
  }
  const [updatedRow] = await knexConnection('combined_course_participations')
    .where({ id: combinedCourseParticipation.id })
    .update({ status: combinedCourseParticipation.status, updatedAt: combinedCourseParticipation.updatedAt })
    .returning('*');

  return new CombinedCourseParticipation(updatedRow);
};

/**
 * @param {[number]} combinedCourseIds
 * @returns {Promise<[CombinedCourseParticipation]>}
 */
export const findByCombinedCourseIds = async ({ combinedCourseIds, page }) => {
  const knexConnection = DomainTransaction.getConnection();
  const queryBuilder = knexConnection('combined_courses')
    .select(
      'combined_course_participations.id',
      'firstName',
      'lastName',
      'combined_course_participations.status',
      'combined_course_participations.questId',
      'organizationLearnerId',
      'combined_course_participations.createdAt',
      'combined_course_participations.updatedAt',
    )
    .join('combined_course_participations', 'combined_courses.questId', 'combined_course_participations.questId')
    .join(
      'view-active-organization-learners',
      'view-active-organization-learners.id',
      'combined_course_participations.organizationLearnerId',
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
