import _ from 'lodash';

import { OrganizationLearnerParticipationTypes } from '../../../src/quest/domain/models/OrganizationLearnerParticipation.js';
import { databaseBuffer } from '../database-buffer.js';
import { buildCombinedCourseParticipation } from './build-combined-course-participation.js';
import { buildOrganizationLearner } from './prescription/organization-learners/build-organization-learner.js';

const buildOrganizationLearnerParticipation = function ({
  id = databaseBuffer.getNextId(),
  type = OrganizationLearnerParticipationTypes.PASSAGE,
  createdAt = new Date(),
  updatedAt = new Date(),
  completedAt = null,
  deletedAt = null,
  deletedBy = null,
  organizationLearnerId,
  status,
  combinedCourseId,
  questId,
} = {}) {
  organizationLearnerId = _.isUndefined(organizationLearnerId) ? buildOrganizationLearner().id : organizationLearnerId;

  const values = {
    id,
    type,
    createdAt,
    updatedAt,
    completedAt,
    deletedAt,
    deletedBy,
    organizationLearnerId,
    status,
  };

  const organizationLearnerParticipation = databaseBuffer.pushInsertable({
    tableName: 'organization_learner_participations',
    values,
  });
  let organizationLearnerCombinedCourseParticipationId;

  if (type === OrganizationLearnerParticipationTypes.COMBINED_COURSE) {
    organizationLearnerCombinedCourseParticipationId = buildCombinedCourseParticipation({
      organizationLearnerId,
      questId,
      combinedCourseId,
      status,
      createdAt,
      updatedAt,
      organizationLearnerParticipationId: organizationLearnerParticipation.id,
    }).id;
  }

  return {
    ...organizationLearnerParticipation,
    organizationLearnerCombinedCourseParticipationId,
  };
};

export { buildOrganizationLearnerParticipation };
