import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { Version } from '../../../../../../src/certification/shared/domain/models/Version.js';
import * as versionRepository from '../../../../../../src/certification/shared/infrastructure/repositories/version-repository.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect } from '../../../../../test-helper.js';

describe('Integration | Certification | Shared | Infrastructure | Repository | Version', function () {
  describe('#getByCourseId', function () {
    context('when candidate has a CORE subscription', function () {
      it('should return the version with a CORE scope matching the reconciliation date', async function () {
        // given
        const reconciledAt = new Date('2025-06-15');
        const challengesConfiguration = { minChallenges: 8, maxChallenges: 12 };

        const versionId = databaseBuilder.factory.buildCertificationVersion({
          scope: Frameworks.CORE,
          startDate: new Date('2025-01-01'),
          expirationDate: null,
          challengesConfiguration,
        }).id;

        const userId = databaseBuilder.factory.buildUser().id;
        const sessionId = databaseBuilder.factory.buildSession().id;

        const candidateId = databaseBuilder.factory.buildCertificationCandidate({
          userId,
          sessionId,
          reconciledAt,
        }).id;

        databaseBuilder.factory.buildCoreSubscription({ certificationCandidateId: candidateId });

        const certificationCourseId = databaseBuilder.factory.buildCertificationCourse({
          userId,
          sessionId,
        }).id;

        await databaseBuilder.commit();

        // when
        const result = await versionRepository.getByCourseId(certificationCourseId);

        // then
        expect(result).to.be.instanceOf(Version);
        expect(result.id).to.equal(versionId);
        expect(result.scope).to.equal(Frameworks.CORE);
        expect(result.challengesConfiguration).to.deep.equal(challengesConfiguration);
      });
    });

    context('when candidate has a CLEA subscription', function () {
      it('should return a version with a CORE scope', async function () {
        // given
        const reconciledAt = new Date('2025-06-15');
        const challengesConfiguration = { minChallenges: 8, maxChallenges: 12 };

        const versionId = databaseBuilder.factory.buildCertificationVersion({
          scope: Frameworks.CORE,
          startDate: new Date('2025-01-01'),
          expirationDate: null,
          challengesConfiguration,
        }).id;

        const userId = databaseBuilder.factory.buildUser().id;
        const sessionId = databaseBuilder.factory.buildSession().id;

        const candidateId = databaseBuilder.factory.buildCertificationCandidate({
          userId,
          sessionId,
          reconciledAt,
        }).id;

        databaseBuilder.factory.buildCoreSubscription({ certificationCandidateId: candidateId });

        const complementaryCertificationId = databaseBuilder.factory.buildComplementaryCertification({
          key: ComplementaryCertificationKeys.CLEA,
        }).id;

        databaseBuilder.factory.buildComplementaryCertificationSubscription({
          certificationCandidateId: candidateId,
          complementaryCertificationId,
        });

        const certificationCourseId = databaseBuilder.factory.buildCertificationCourse({
          userId,
          sessionId,
        }).id;

        await databaseBuilder.commit();

        // when
        const result = await versionRepository.getByCourseId(certificationCourseId);

        // then
        expect(result).to.be.instanceOf(Version);
        expect(result.id).to.equal(versionId);
        expect(result.scope).to.equal(Frameworks.CORE);
      });
    });

    context('when candidate has only a complementary subscription', function () {
      it('should return the version matching the complementary certification key', async function () {
        // given
        const reconciledAt = new Date('2025-06-15');
        const challengesConfiguration = { minChallenges: 6, maxChallenges: 10 };

        const versionId = databaseBuilder.factory.buildCertificationVersion({
          scope: Frameworks.PIX_PLUS_DROIT,
          startDate: new Date('2025-01-01'),
          expirationDate: null,
          challengesConfiguration,
        }).id;

        const userId = databaseBuilder.factory.buildUser().id;
        const sessionId = databaseBuilder.factory.buildSession().id;

        const candidateId = databaseBuilder.factory.buildCertificationCandidate({
          userId,
          sessionId,
          reconciledAt,
        }).id;

        const complementaryCertificationId = databaseBuilder.factory.buildComplementaryCertification({
          key: ComplementaryCertificationKeys.PIX_PLUS_DROIT,
        }).id;

        databaseBuilder.factory.buildComplementaryCertificationSubscription({
          certificationCandidateId: candidateId,
          complementaryCertificationId,
        });

        const certificationCourseId = databaseBuilder.factory.buildCertificationCourse({
          userId,
          sessionId,
        }).id;

        await databaseBuilder.commit();

        // when
        const result = await versionRepository.getByCourseId(certificationCourseId);

        // then
        expect(result).to.be.instanceOf(Version);
        expect(result.id).to.equal(versionId);
        expect(result.scope).to.equal(Frameworks.PIX_PLUS_DROIT);
        expect(result.challengesConfiguration).to.deep.equal(challengesConfiguration);
      });
    });

    context('when no candidate found for the certification course', function () {
      it('should throw a NotFoundError', async function () {
        // given
        const nonExistentCourseId = 999999;

        // when
        const error = await catchErr(versionRepository.getByCourseId)(nonExistentCourseId);

        // then
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal(`No candidate found for certification course ${nonExistentCourseId}`);
      });
    });

    context('when there is no version found for the scope and reconciliation date', function () {
      it('should throw a NotFoundError', async function () {
        // given
        const reconciledAt = new Date('2025-06-15');

        const userId = databaseBuilder.factory.buildUser().id;
        const sessionId = databaseBuilder.factory.buildSession().id;

        const candidateId = databaseBuilder.factory.buildCertificationCandidate({
          userId,
          sessionId,
          reconciledAt,
        }).id;

        databaseBuilder.factory.buildCoreSubscription({ certificationCandidateId: candidateId });

        const certificationCourseId = databaseBuilder.factory.buildCertificationCourse({
          userId,
          sessionId,
        }).id;

        await databaseBuilder.commit();

        // when
        const error = await catchErr(versionRepository.getByCourseId)(certificationCourseId);

        // then
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.include('No certification version found for scope');
      });
    });
  });
});
