import Joi from 'joi';

import { EntityValidationError } from '../../../../shared/domain/errors.js';

export class CertificationFrameworksChallenge {
  static #schema = Joi.object({
    challengeId: Joi.string().required(),
    discriminant: Joi.number().allow(null).optional(),
    difficulty: Joi.number().allow(null).optional(),
  });

  /**
   * @param {Object} params
   * @param {number} [params.discriminant]
   * @param {number} [params.difficulty]
   * @param {string} params.challengeId
   */
  constructor({ challengeId, discriminant, difficulty }) {
    this.challengeId = challengeId;
    this.discriminant = discriminant;
    this.difficulty = difficulty;

    this.#validate();
  }

  calibrate({ discriminant, difficulty }) {
    this.discriminant = discriminant;
    this.difficulty = difficulty;
  }

  #validate() {
    const { error } = CertificationFrameworksChallenge.#schema.validate(this, { allowUnknown: false });
    if (error) {
      throw EntityValidationError.fromJoiErrors(error.details);
    }
  }
}
