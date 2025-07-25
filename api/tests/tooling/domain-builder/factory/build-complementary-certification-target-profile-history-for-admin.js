import { ComplementaryCertificationTargetProfileHistory } from '../../../../src/certification/configuration/domain/models/ComplementaryCertificationTargetProfileHistory.js';

const buildComplementaryCertificationTargetProfileHistory = function ({
  id = 1,
  key = 'Complementary certification key',
  label = 'Complementary certification name',
  hasExternalJury = false,
  targetProfilesHistory = [],
} = {}) {
  return new ComplementaryCertificationTargetProfileHistory({
    id,
    key,
    label,
    hasExternalJury,
    targetProfilesHistory,
  });
};

export { buildComplementaryCertificationTargetProfileHistory };
