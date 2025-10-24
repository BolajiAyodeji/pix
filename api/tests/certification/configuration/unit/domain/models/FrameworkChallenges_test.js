import { FrameworkChallenges } from '../../../../../../src/certification/configuration/domain/models/FrameworkChallenges.js';
import { EntityValidationError } from '../../../../../../src/shared/domain/errors.js';
import { catchErrSync, expect } from '../../../../../test-helper.js';

describe('Unit | Certification | Configuration | Domain | Models | FrameworkChallenges', function () {
  it('should build a FrameworkChallenges', function () {
    // given
    // when
    const frameworkChallenges = new FrameworkChallenges({
      versionId: 123,
      challenges: [],
    });

    // then
    expect(frameworkChallenges).to.deep.equal({
      versionId: 123,
      challenges: [],
    });
  });

  context('class invariants', function () {
    it('should not allow FrameworkChallenges without versionId', function () {
      // given
      // when
      const error = catchErrSync(() => new FrameworkChallenges({ challenges: [] }))();

      // then
      expect(error).to.be.an.instanceOf(EntityValidationError);
    });

    it('should not allow FrameworkChallenges with null versionId', function () {
      // given
      // when
      const error = catchErrSync(() => new FrameworkChallenges({ versionId: null, challenges: [] }))();

      // then
      expect(error).to.be.an.instanceOf(EntityValidationError);
    });

    it('should not allow FrameworkChallenges with non-integer versionId', function () {
      // given
      // when
      const error = catchErrSync(() => new FrameworkChallenges({ versionId: 'not-a-number', challenges: [] }))();

      // then
      expect(error).to.be.an.instanceOf(EntityValidationError);
    });
  });
});
