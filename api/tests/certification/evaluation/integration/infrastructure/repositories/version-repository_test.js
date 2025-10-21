import * as versionRepository from '../../../../../../src/certification/evaluation/infrastructure/repositories/version-repository.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { Version } from '../../../../../../src/certification/shared/domain/models/Version.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect } from '../../../../../test-helper.js';

describe('Integration | Certification | Evaluation | Infrastructure | Repository | Version', function () {
  describe('#getById', function () {
    it('should return a Version it exists', async function () {
      // given
      const challengesConfiguration = { minChallenges: 5, maxChallenges: 10 };

      const versionId = databaseBuilder.factory.buildCertificationVersion({
        scope: Frameworks.PIX_PLUS_DROIT,
        startDate: new Date('2025-03-01'),
        challengesConfiguration,
      }).id;

      await databaseBuilder.commit();

      // when
      const result = await versionRepository.getById(versionId);

      // then
      expect(result).to.be.instanceOf(Version);
      expect(result.id).to.equal(versionId);
      expect(result.scope).to.equal(Frameworks.PIX_PLUS_DROIT);
      expect(result.challengesConfiguration).to.deep.equal(challengesConfiguration);
    });

    context('when version does not exist', function () {
      it('should throw a NotFoundError', async function () {
        // given
        const nonExistentVersionId = 999999;

        // when
        const error = await catchErr(versionRepository.getById)(nonExistentVersionId);

        // then
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal(`No certification version found for id ${nonExistentVersionId}`);
      });
    });
  });
});
