import * as consolidatedFrameworkRepository from '../../../../../../src/certification/configuration/infrastructure/repositories/consolidated-framework-repository.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect } from '../../../../../test-helper.js';

describe('Certification | Configuration | Integration | Repository | consolidated-framework', function () {
  describe('#getCurrentFrameworkByComplementaryCertificationKey', function () {
    it('should get the current complementary certification framework', async function () {
      // given
      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();

      const challenge = databaseBuilder.factory.learningContent.buildChallenge({ id: 'challengeId1234' });

      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        createdAt: new Date('2025-11-21'),
        calibrationId: 1,
        challengeId: challenge.id,
      });

      const lastVersionCertificationFrameworkChallenge = databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        createdAt: new Date('2025-12-21'),
        calibrationId: 2,
        challengeId: challenge.id,
      });

      await databaseBuilder.commit();

      // when
      const currentConsolidatedFramework =
        await consolidatedFrameworkRepository.getCurrentFrameworkByComplementaryCertificationKey({
          complementaryCertificationKey: complementaryCertification.key,
        });

      // then
      expect(currentConsolidatedFramework).to.deep.equal({
        calibrationId: lastVersionCertificationFrameworkChallenge.calibrationId,
        complementaryCertificationKey: complementaryCertification.key,
        version: lastVersionCertificationFrameworkChallenge.version,
        challenges: [
          {
            challengeId: lastVersionCertificationFrameworkChallenge.challengeId,
            difficulty: 3.5,
            discriminant: 2.2,
          },
        ],
      });
    });

    context('when there is no existing framework version', function () {
      it('should throw a not found error', async function () {
        // given
        const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();
        await databaseBuilder.commit();

        // when
        const error = await catchErr(
          consolidatedFrameworkRepository.getCurrentFrameworkByComplementaryCertificationKey,
        )({
          complementaryCertificationKey: complementaryCertification.key,
        });

        // then
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal(`There is no framework for complementary ${complementaryCertification.key}`);
      });
    });
  });

  describe('#getFrameworkHistory', function () {
    it('should return an empty array when there is no framework history', async function () {
      // given
      const complementaryCertificationKey = ComplementaryCertificationKeys.PIX_PLUS_DROIT;

      // when
      const frameworkHistory = await consolidatedFrameworkRepository.getFrameworkHistory({
        complementaryCertificationKey,
      });

      // then
      expect(frameworkHistory).to.deep.equal([]);
    });

    it('should return the framework history', async function () {
      // given
      const version1 = '20240315000000';
      const version2 = '20250621000000';
      const version3 = '20260101000000';
      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification({
        key: 'GOOD_KEY',
      });
      const otherComplementaryCertification = databaseBuilder.factory.buildComplementaryCertification({
        key: 'OTHER_KEY',
      });

      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        version: version1,
        challengeId: 'rec123',
        complementaryCertificationKey: complementaryCertification.key,
      });
      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        version: version2,
        challengeId: 'rec234',
        complementaryCertificationKey: complementaryCertification.key,
      });
      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        version: version2,
        challengeId: 'rec345',
        complementaryCertificationKey: otherComplementaryCertification.key,
      });
      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        version: version3,
        challengeId: 'rec456',
        complementaryCertificationKey: complementaryCertification.key,
      });
      await databaseBuilder.commit();

      // when
      const frameworkHistory = await consolidatedFrameworkRepository.getFrameworkHistory({
        complementaryCertificationKey: complementaryCertification.key,
      });

      // then
      expect(frameworkHistory).to.deep.equal([version3, version2, version1]);
    });
  });
});
