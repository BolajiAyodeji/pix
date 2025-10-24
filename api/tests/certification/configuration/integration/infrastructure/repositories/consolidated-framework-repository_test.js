import * as consolidatedFrameworkRepository from '../../../../../../src/certification/configuration/infrastructure/repositories/consolidated-framework-repository.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, domainBuilder, expect, knex } from '../../../../../test-helper.js';

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

  describe('#getByVersionAndComplementaryKey', function () {
    it('should return an error when it does not exist', async function () {
      // given
      const complementaryCertificationKey = ComplementaryCertificationKeys.PIX_PLUS_DROIT;

      // when
      const error = await catchErr(consolidatedFrameworkRepository.getByVersionAndComplementaryKey)({
        complementaryCertificationKey,
        version: '20250621000000',
      });

      // then
      expect(error).to.deepEqualInstance(new NotFoundError('Consolidated framework does not exist'));
    });

    it('should return a consolidated framework sorted by challengeId', async function () {
      // given
      const version = '20250621000000';
      const otherCreatedAt = new Date('2023-06-23');
      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();
      const secondChallengeSelected = databaseBuilder.factory.buildCertificationFrameworksChallenge({
        version,
        challengeId: 'rec234',
        complementaryCertificationKey: complementaryCertification.key,
      });
      const firstChallengeSelected = databaseBuilder.factory.buildCertificationFrameworksChallenge({
        version,
        challengeId: 'rec123',
        complementaryCertificationKey: complementaryCertification.key,
      });
      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        createdAt: otherCreatedAt,
        challengeId: 'rec234',
        complementaryCertificationKey: complementaryCertification.key,
      });
      await databaseBuilder.commit();

      const expectedFrameworkChallenges = domainBuilder.certification.configuration.buildConsolidatedFramework({
        complementaryCertificationKey: complementaryCertification.key,
        version,
        challenges: [
          domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
            challengeId: firstChallengeSelected.challengeId,
            discriminant: firstChallengeSelected.discriminant,
            difficulty: firstChallengeSelected.difficulty,
          }),
          domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
            challengeId: secondChallengeSelected.challengeId,
            discriminant: secondChallengeSelected.discriminant,
            difficulty: secondChallengeSelected.difficulty,
          }),
        ],
      });

      // when
      const certificationFrameworksChallenges = await consolidatedFrameworkRepository.getByVersionAndComplementaryKey({
        complementaryCertificationKey: complementaryCertification.key,
        version,
      });

      // then
      expect(certificationFrameworksChallenges).to.deep.equal(expectedFrameworkChallenges);
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

  describe('#save', function () {
    it('should update framework challenges with discriminant, difficulty and calibrationId properties', async function () {
      // given
      const complementaryCertificationKey = ComplementaryCertificationKeys.PIX_PLUS_DROIT;
      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification({
        key: complementaryCertificationKey,
      });

      const firstCertificationFrameworksChallenge = databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        createdAt: new Date('2022-01-01T08:00:00Z'),
        challengeId: 'rec123',
        discriminant: null,
        difficulty: null,
      });

      const secondCertificationFrameworksChallenge = databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        createdAt: firstCertificationFrameworksChallenge.createdAt,
        challengeId: 'rec456',
        discriminant: null,
        difficulty: null,
      });

      await databaseBuilder.commit();

      const firstCalibratedCertificationFrameworksChallenge =
        domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
          challengeId: firstCertificationFrameworksChallenge.challengeId,
          discriminant: 1.3,
          difficulty: 4.3,
        });
      const secondCalibratedCertificationFrameworksChallenge =
        domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
          challengeId: secondCertificationFrameworksChallenge.challengeId,
          discriminant: 3.2,
          difficulty: 1.5,
        });

      const consolidatedFramework = domainBuilder.certification.configuration.buildConsolidatedFramework({
        calibrationId: 1,
        challenges: [firstCalibratedCertificationFrameworksChallenge, secondCalibratedCertificationFrameworksChallenge],
        complementaryCertificationKey: complementaryCertification.key,
        version: firstCertificationFrameworksChallenge.version,
      });

      const expectedCalibratedFrameworkChallenges = [
        {
          ...firstCertificationFrameworksChallenge,
          discriminant: firstCalibratedCertificationFrameworksChallenge.discriminant,
          difficulty: firstCalibratedCertificationFrameworksChallenge.difficulty,
          calibrationId: consolidatedFramework.calibrationId,
          versionId: null,
        },
        {
          ...secondCertificationFrameworksChallenge,
          discriminant: secondCalibratedCertificationFrameworksChallenge.discriminant,
          difficulty: secondCalibratedCertificationFrameworksChallenge.difficulty,
          calibrationId: consolidatedFramework.calibrationId,
          versionId: null,
        },
      ];

      // when
      await consolidatedFrameworkRepository.save(consolidatedFramework);

      // then
      const calibratedFrameworksChallenges = await knex('certification-frameworks-challenges');
      expect(calibratedFrameworksChallenges).to.have.deep.members(expectedCalibratedFrameworkChallenges);
    });
  });
});
