import { FrameworkChallenges } from '../../../../../../src/certification/configuration/domain/models/FrameworkChallenges.js';

export const buildFrameworkChallenges = function ({ versionId = 1, challenges = [] } = {}) {
  return new FrameworkChallenges({
    versionId,
    challenges,
  });
};
