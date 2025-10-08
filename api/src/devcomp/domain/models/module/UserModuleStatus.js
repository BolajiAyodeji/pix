import { DomainError } from '../../../../shared/domain/errors.js';
import { assertNotNullOrUndefined } from '../../../../shared/domain/models/asserts.js';

const StatusesEnumValues = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

class UserModuleStatus {
  #referencePassage;
  constructor({ userId, moduleId, passages }) {
    assertNotNullOrUndefined(userId, 'The userId is required for a UserModuleStatus');
    assertNotNullOrUndefined(moduleId, 'The moduleId is required for a UserModuleStatus');
    assertNotNullOrUndefined(passages, 'The passages field is required for a UserModuleStatus');

    this.moduleId = moduleId;
    this.userId = userId;

    this.#assertAllPassageHaveTheSameUserAndModuleId(passages);
    this.passages = passages;
    this.#referencePassage = this.#getReferencePassage();

    this.status = this.#computeStatus();

    this.createdAt = this.#referencePassage?.createdAt ?? new Date();
    this.updatedAt = this.#referencePassage?.updatedAt ?? new Date();
    this.terminatedAt = this.#referencePassage?.terminatedAt ?? null;
  }

  #computeStatus() {
    if (!this.#referencePassage) {
      return StatusesEnumValues.NOT_STARTED;
    }

    const hasTerminatedPassage = Boolean(this.#referencePassage.terminatedAt);

    return hasTerminatedPassage ? StatusesEnumValues.COMPLETED : StatusesEnumValues.IN_PROGRESS;
  }

  #assertAllPassageHaveTheSameUserAndModuleId(passages) {
    const assertion = passages.every((passage) => passage.moduleId === this.moduleId && passage.userId === this.userId);

    if (!assertion) {
      throw new DomainError('Module and user id of passages must be the same as UserModuleStatus attributes');
    }
  }

  #getReferencePassage() {
    const sortedPassages = this.passages.toSorted((a, b) => {
      if (a.terminatedAt && b.terminatedAt) return b.terminatedAt - a.terminatedAt;
      if (a.terminatedAt && !b.terminatedAt) return -1;
      if (!a.terminatedAt && b.terminatedAt) return 1;

      return b.updatedAt - a.updatedAt;
    });

    return sortedPassages[0];
  }
}

export { StatusesEnumValues, UserModuleStatus };
