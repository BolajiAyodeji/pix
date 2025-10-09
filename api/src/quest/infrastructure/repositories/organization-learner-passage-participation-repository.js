import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { OrganizationLearnerParticipation } from '../../domain/models/OrganizationLearnerParticipation.js';

export const synchronize = async ({ organizationLearnerId, moduleIds, modulesApi, organizationLearnerApi }) => {
  if (moduleIds.length === 0) {
    return;
  }

  const knexConn = DomainTransaction.getConnection();

  const learner = await organizationLearnerApi.get(organizationLearnerId);
  const modulePassages = await modulesApi.getUserModuleStatuses({ userId: learner.userId, moduleIds });

  const learnerParticipationsByModule = await knexConn('organization_learner_participations')
    .select('organization_learner_participations.id', 'moduleId')
    .join(
      'organization_learner_passage_participations',
      'organization_learner_participations.id',
      'organization_learner_passage_participations.organizationLearnerParticipationId',
    )
    .where({ organizationLearnerId: organizationLearnerId })
    .whereNull('deletedAt')
    .whereIn('moduleId', moduleIds);

  for (const modulePassage of modulePassages) {
    const learnerParticipationModule = learnerParticipationsByModule.find(
      (learnerParticipation) => learnerParticipation.moduleId === modulePassage.id,
    );

    const organizationLearnerPassageParticipation = OrganizationLearnerParticipation.buildFromPassage({
      id: learnerParticipationModule?.id,
      organizationLearnerId,
      createdAt: modulePassage.createdAt,
      status: modulePassage.status,
      updatedAt: modulePassage.updatedAt,
      terminatedAt: modulePassage.terminatedAt,
      moduleId: modulePassage.id,
    });

    if (organizationLearnerPassageParticipation.id) {
      await knexConn('organization_learner_participations')
        .update(organizationLearnerPassageParticipation)
        .where('id', organizationLearnerPassageParticipation.id);
    } else {
      const [{ id: organizationLearnerParticipationId }] = await knexConn('organization_learner_participations')
        .insert(organizationLearnerPassageParticipation)
        .returning('id');

      await knexConn('organization_learner_passage_participations').insert({
        moduleId: modulePassage.id,
        organizationLearnerParticipationId,
      });
    }
  }
};
