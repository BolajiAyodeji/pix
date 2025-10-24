import { calibrateConsolidatedFramework } from '../../../../../../src/certification/configuration/domain/usecases/calibrate-consolidated-framework.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Configuration | Unit | UseCase | calibrate-consolidated-framework', function () {
  let frameworkChallengesRepository, activeCalibratedChallengeRepository, versionsRepository, version;

  beforeEach(async function () {
    sinon.stub(DomainTransaction, 'execute').callsFake((lambda) => lambda());

    version = domainBuilder.certification.configuration.buildConfigurationVersion({
      scope: ComplementaryCertificationKeys.PIX_PLUS_DROIT,
    });

    frameworkChallengesRepository = {
      getByVersionId: sinon.stub(),
      save: sinon.stub(),
    };

    activeCalibratedChallengeRepository = {
      getByComplementaryKeyAndCalibrationId: sinon.stub(),
    };

    versionsRepository = {
      getById: sinon.stub(),
    };
  });

  describe('when framework has as many challenges as active calibrated ones', function () {
    it('calibrates the framework challenges', async function () {
      // given
      const calibrationId = 1;
      const versionId = 123;

      const frameworkChallenges = domainBuilder.certification.configuration.buildFrameworkChallenges({
        versionId,
        challenges: [
          domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
            challengeId: 'rec1234',
            discriminant: null,
            difficulty: null,
          }),
        ],
      });

      const activeCalibratedChallenges = [
        domainBuilder.certification.configuration.buildActiveCalibratedChallenge({
          scope: version.scope,
          challengeId: frameworkChallenges.challenges[0].challengeId,
          discriminant: 1.4,
          difficulty: 2.2,
        }),
      ];

      versionsRepository.getById.withArgs({ id: versionId }).resolves(version);

      frameworkChallengesRepository.getByVersionId
        .withArgs({ versionId })
        .resolves(frameworkChallenges);

      activeCalibratedChallengeRepository.getByComplementaryKeyAndCalibrationId
        .withArgs({
          scope: version.scope,
          calibrationId,
        })
        .resolves(activeCalibratedChallenges);

      // when
      await calibrateConsolidatedFramework({
        versionId,
        calibrationId,
        frameworkChallengesRepository,
        activeCalibratedChallengeRepository,
        versionsRepository,
      });

      // then
      expect(frameworkChallengesRepository.save).to.have.been.calledOnceWith(frameworkChallenges);
    });
  });

  describe('when framework has more challenges than active calibrated ones', function () {
    it('calibrates only the matching framework challenges', async function () {
      // given
      const calibrationId = 1;
      const versionId = 123;

      const frameworkChallenges = domainBuilder.certification.configuration.buildFrameworkChallenges({
        versionId,
        challenges: [
          domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
            challengeId: 'rec1234',
            discriminant: null,
            difficulty: null,
          }),
          domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
            challengeId: 'rec3456',
            discriminant: null,
            difficulty: null,
          }),
        ],
      });

      const activeCalibratedChallenges = [
        domainBuilder.certification.configuration.buildActiveCalibratedChallenge({
          scope: version.scope,
          challengeId: frameworkChallenges.challenges[1].challengeId,
          discriminant: 1.4,
          difficulty: 2.2,
        }),
      ];

      versionsRepository.getById.withArgs({ id: versionId }).resolves(version);

      frameworkChallengesRepository.getByVersionId
        .withArgs({ versionId })
        .resolves(frameworkChallenges);

      activeCalibratedChallengeRepository.getByComplementaryKeyAndCalibrationId
        .withArgs({
          scope: version.scope,
          calibrationId,
        })
        .resolves(activeCalibratedChallenges);

      // when
      await calibrateConsolidatedFramework({
        versionId,
        calibrationId,
        frameworkChallengesRepository,
        activeCalibratedChallengeRepository,
        versionsRepository,
      });

      // then
      expect(frameworkChallengesRepository.save).to.have.been.calledOnceWith(frameworkChallenges);
    });
  });

  describe('when active calibrated has more challenges than framework ones', function () {
    it('should return an error', async function () {
      // given
      const calibrationId = 1;
      const versionId = 123;

      const frameworkChallenges = domainBuilder.certification.configuration.buildFrameworkChallenges({
        versionId,
        challenges: [
          domainBuilder.certification.configuration.buildCertificationFrameworksChallenge({
            challengeId: 'rec1234',
            discriminant: null,
            difficulty: null,
          }),
        ],
      });

      const activeCalibratedChallenges = [
        domainBuilder.certification.configuration.buildActiveCalibratedChallenge({
          scope: version.scope,
          challengeId: frameworkChallenges.challenges[0].challengeId,
          discriminant: 1.4,
          difficulty: 2.2,
        }),
        domainBuilder.certification.configuration.buildActiveCalibratedChallenge({
          scope: version.scope,
        }),
      ];

      versionsRepository.getById.withArgs({ id: versionId }).resolves(version);

      frameworkChallengesRepository.getByVersionId
        .withArgs({ versionId })
        .resolves(frameworkChallenges);

      activeCalibratedChallengeRepository.getByComplementaryKeyAndCalibrationId
        .withArgs({
          scope: version.scope,
          calibrationId,
        })
        .resolves(activeCalibratedChallenges);

      // when
      const error = await catchErr(calibrateConsolidatedFramework)({
        versionId,
        calibrationId,
        frameworkChallengesRepository,
        activeCalibratedChallengeRepository,
        versionsRepository,
      });

      // then
      expect(error).to.be.an.instanceof(NotFoundError);
      expect(error.message).to.equal('The challenge rec123 does not exist in the framework challenges');
    });
  });
});
