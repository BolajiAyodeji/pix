import { databaseBuffer } from '../database-buffer.js';

const buildOrganizationLearnerPassageParticipation = function ({
  id = databaseBuffer.getNextId(),
  moduleId,
  organizationLearnerParticipationId,
} = {}) {
  return databaseBuffer.pushInsertable({
    tableName: 'organization_learner_passage_participations',
    values: { id, moduleId, organizationLearnerParticipationId },
  });
};

export { buildOrganizationLearnerPassageParticipation };
