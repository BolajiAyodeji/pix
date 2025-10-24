import Joi from 'joi';

import { EntityValidationError } from '../../../../shared/domain/errors.js';

/**
 * @typedef {import ('./CertificationFrameworksChallenge.js').CertificationFrameworksChallenge} CertificationFrameworksChallenge
 */

export class FrameworkChallenges {
  static #schema = Joi.object({
    versionId: Joi.number().integer().required(),
    challenges: Joi.array().optional(),
  });

  /**
   * @param {Object} params
   * @param {number} params.versionId
   * @param {Array<CertificationFrameworksChallenge>} [params.challenges]
   */
  constructor({ versionId, challenges = [] }) {
    this.versionId = versionId;
    this.challenges = challenges;

    this.#validate();
  }

  #validate() {
    const { error } = FrameworkChallenges.#schema.validate(this, { allowUnknown: false });
    if (error) {
      throw EntityValidationError.fromJoiErrors(error.details);
    }
  }
}
