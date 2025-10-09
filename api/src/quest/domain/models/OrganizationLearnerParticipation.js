import { StatusesEnumValues } from '../../../devcomp/domain/models/module/UserModuleStatus.js';

export const OrganizationLearnerParticipationTypes = {
  PASSAGE: 'PASSAGE',
  COMBINED_COURSE: 'COMBINED_COURSE',
};

export const OrganizationLearnerParticipationStatuses = {
  NOT_STARTED: 'NOT_STARTED',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
};

export class OrganizationLearnerParticipation {
  constructor({
    id,
    organizationLearnerId,
    createdAt,
    updatedAt,
    completedAt,
    deletedAt,
    deletedBy,
    status,
    type,
    attributes,
  }) {
    this.id = id;
    this.organizationLearnerId = organizationLearnerId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.completedAt = completedAt;
    this.deletedAt = deletedAt;
    this.deletedBy = deletedBy;
    this.status = status;
    this.type = type;
    this.attributes = attributes;
  }

  static buildFromPassage({
    id,
    organizationLearnerId,
    createdAt,
    updatedAt,
    terminatedAt,
    deletedAt,
    deletedBy,
    status,
    moduleId,
  }) {
    let participationStatus;

    if (status === StatusesEnumValues.IN_PROGRESS)
      participationStatus = OrganizationLearnerParticipationStatuses.STARTED;
    else if (status === StatusesEnumValues.COMPLETED)
      participationStatus = OrganizationLearnerParticipationStatuses.COMPLETED;
    else if (status == StatusesEnumValues.NOT_STARTED)
      participationStatus = OrganizationLearnerParticipationStatuses.NOT_STARTED;

    return new OrganizationLearnerParticipation({
      id,
      organizationLearnerId,
      createdAt,
      updatedAt,
      completedAt: terminatedAt,
      deletedAt,
      deletedBy,
      status: participationStatus,
      type: OrganizationLearnerParticipationTypes.PASSAGE,
      attributes: JSON.stringify({ id: moduleId }),
    });
  }
}
