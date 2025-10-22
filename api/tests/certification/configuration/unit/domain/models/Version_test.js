import { Version } from '../../../../../../src/certification/configuration/domain/models/Version.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { EntityValidationError } from '../../../../../../src/shared/domain/errors.js';
import { catchErrSync, expect } from '../../../../../test-helper.js';

describe('Unit | Certification | Configuration | Domain | Models | Version', function () {
  it('should build a Version with all fields', function () {
    // given
    const versionData = {
      id: 123,
      scope: Frameworks.CORE,
      startDate: new Date('2025-01-01'),
      expirationDate: new Date('2025-12-31'),
      assessmentDuration: 120,
      globalScoringConfiguration: [{ capacity: 2.5 }],
      competencesScoringConfiguration: [{ competence1: 'config' }],
      challengesConfiguration: { minChallenges: 5, maxChallenges: 10 },
    };

    // when
    const version = new Version(versionData);

    // then
    expect(version).to.be.instanceOf(Version);
    expect(version).to.deep.equal(versionData);
  });

  it('should build a Version with optional fields as null', function () {
    // given
    const versionData = {
      id: 456,
      scope: Frameworks.PIX_PLUS_DROIT,
      startDate: new Date('2025-06-01'),
      expirationDate: null,
      assessmentDuration: 90,
      globalScoringConfiguration: null,
      competencesScoringConfiguration: null,
      challengesConfiguration: { minChallenges: 3 },
    };

    // when
    const version = new Version(versionData);

    // then
    expect(version).to.be.instanceOf(Version);
    expect(version.id).to.equal(456);
    expect(version.scope).to.equal(Frameworks.PIX_PLUS_DROIT);
    expect(version.expirationDate).to.be.null;
    expect(version.globalScoringConfiguration).to.be.null;
    expect(version.competencesScoringConfiguration).to.be.null;
  });

  it('should throw an EntityValidationError when trying to construct an invalid Version', function () {
    // given
    const invalidData = {
      id: 123,
      scope: Frameworks.CORE,
      startDate: 'not-a-date',
      assessmentDuration: 120,
      challengesConfiguration: { config: 'test' },
    };

    // when
    const error = catchErrSync(() => new Version(invalidData))();

    // then
    expect(error).to.be.instanceOf(EntityValidationError);
  });
});
