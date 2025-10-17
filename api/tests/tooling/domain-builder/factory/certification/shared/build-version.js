import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { Version } from '../../../../../../src/certification/shared/domain/models/Version.js';

export const buildVersion = ({
  id = 1,
  scope = Frameworks.CORE,
  startDate = new Date(),
  expirationDate,
  assessmentDuration = 105,
  globalScoringConfiguration,
  competencesScoringConfiguration,
  challengesConfiguration = {},
} = {}) => {
  return new Version({
    id,
    scope,
    startDate,
    expirationDate,
    assessmentDuration,
    globalScoringConfiguration,
    competencesScoringConfiguration,
    challengesConfiguration,
  });
};
