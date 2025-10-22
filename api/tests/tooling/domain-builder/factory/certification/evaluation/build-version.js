import { Version } from '../../../../../../src/certification/evaluation/domain/models/Version.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';

export const buildVersion = ({ id = 1, scope = Frameworks.CORE, challengesConfiguration = {} } = {}) => {
  return new Version({
    id,
    scope,
    challengesConfiguration,
  });
};
