import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { Version } from '../../../../../../src/certification/shared/domain/models/Version.js';
import { EntityValidationError } from '../../../../../../src/shared/domain/errors.js';
import { catchErrSync, expect } from '../../../../../test-helper.js';

describe('Unit | Certification | Evaluation | Domain | Models | Version', function () {
  describe('constructor', function () {
    it('should build a Version with id, scope and challengesConfiguration', function () {
      // given
      const versionData = {
        id: 123,
        scope: Frameworks.CORE,
        challengesConfiguration: { minChallenges: 5, maxChallenges: 10 },
      };

      // when
      const version = new Version(versionData);

      // then
      expect(version).to.be.instanceOf(Version);
      expect(version.id).to.equal(123);
      expect(version.scope).to.equal(Frameworks.CORE);
      expect(version.challengesConfiguration).to.deep.equal({ minChallenges: 5, maxChallenges: 10 });
    });

    it('should build a Version with PIX_PLUS_DROIT scope', function () {
      // given
      const versionData = {
        id: 456,
        scope: Frameworks.PIX_PLUS_DROIT,
        challengesConfiguration: { config: 'test' },
      };

      // when
      const version = new Version(versionData);

      // then
      expect(version).to.be.instanceOf(Version);
      expect(version.id).to.equal(456);
      expect(version.scope).to.equal(Frameworks.PIX_PLUS_DROIT);
      expect(version.challengesConfiguration).to.deep.equal({ config: 'test' });
    });

    it('should throw an EntityValidationError when id is missing', function () {
      // given
      const invalidData = {
        scope: Frameworks.CORE,
      };

      // when
      const error = catchErrSync(() => new Version(invalidData))();

      // then
      expect(error).to.be.instanceOf(EntityValidationError);
    });

    it('should throw an EntityValidationError when scope is missing', function () {
      // given
      const invalidData = {
        id: 123,
      };

      // when
      const error = catchErrSync(() => new Version(invalidData))();

      // then
      expect(error).to.be.instanceOf(EntityValidationError);
    });

    it('should throw an EntityValidationError when scope is invalid', function () {
      // given
      const invalidData = {
        id: 123,
        scope: 'INVALID_SCOPE',
      };

      // when
      const error = catchErrSync(() => new Version(invalidData))();

      // then
      expect(error).to.be.instanceOf(EntityValidationError);
    });

    it('should throw an EntityValidationError when id is not a number', function () {
      // given
      const invalidData = {
        id: 'not-a-number',
        scope: Frameworks.CORE,
        challengesConfiguration: { config: 'test' },
      };

      // when
      const error = catchErrSync(() => new Version(invalidData))();

      // then
      expect(error).to.be.instanceOf(EntityValidationError);
    });

    it('should throw an EntityValidationError when challengesConfiguration is missing', function () {
      // given
      const invalidData = {
        id: 123,
        scope: Frameworks.CORE,
      };

      // when
      const error = catchErrSync(() => new Version(invalidData))();

      // then
      expect(error).to.be.instanceOf(EntityValidationError);
    });

    it('should throw an EntityValidationError when challengesConfiguration is not an object', function () {
      // given
      const invalidData = {
        id: 123,
        scope: Frameworks.CORE,
        challengesConfiguration: 'not-an-object',
      };

      // when
      const error = catchErrSync(() => new Version(invalidData))();

      // then
      expect(error).to.be.instanceOf(EntityValidationError);
    });
  });
});
