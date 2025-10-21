/**
 * @typedef {import('./Frameworks.js').Frameworks} Frameworks
 */

import Joi from 'joi';

import { EntityValidationError } from '../../../../shared/domain/errors.js';
import { Frameworks } from './Frameworks.js';

export class Version {
  static #schema = Joi.object({
    id: Joi.number().required(),
    scope: Joi.string()
      .required()
      .valid(...Object.values(Frameworks)),
    challengesConfiguration: Joi.object().required(),
  });

  /**
   * @param {Object} params
   * @param {number} params.id - version identifier
   * @param {Frameworks} params.scope - Framework scope (CORE, DROIT, etc.)
   * @param {Object} params.challengesConfiguration - Challenges configuration
   */
  constructor({ id, scope, challengesConfiguration }) {
    this.id = id;
    this.scope = scope;
    this.challengesConfiguration = challengesConfiguration;
    this.#validate();
  }

  #validate() {
    const { error } = Version.#schema.validate(this, { allowUnknown: false });
    if (error) {
      throw EntityValidationError.fromJoiErrors(error.details);
    }
  }
}
