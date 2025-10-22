import * as simulateFlashAssessmentScenarioModule from '../../../../../../src/certification/evaluation/domain/usecases/simulate-flash-assessment-scenario.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { FRENCH_FRANCE } from '../../../../../../src/shared/domain/services/locale-service.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

const { simulateFlashAssessmentScenario } = simulateFlashAssessmentScenarioModule;

describe('Unit | Domain | Usecases | simulate-flash-assessment-scenario', function () {
  describe('#simulateFlashAssessmentScenario', function () {
    it('should fetch the referential challenges', async function () {
      // given
      const locale = FRENCH_FRANCE;
      const accessibilityAdjustmentNeeded = false;
      const versionId = 1;
      const challengesConfiguration = { minimumEstimatedSuccessRateRanges: [] };
      const version = domainBuilder.certification.evaluation.buildEvaluationVersion({
        id: versionId,
        scope: Frameworks.PIX_PLUS_DROIT,
        challengesConfiguration,
      });

      const challengeRepositoryStub = { findActiveFlashCompatible: sinon.stub() };

      const versionRepositoryStub = {
        getById: sinon.stub().resolves(version),
      };

      // when
      await catchErr(simulateFlashAssessmentScenario)({
        locale,
        accessibilityAdjustmentNeeded,
        complementaryCertificationKey: undefined,
        sharedChallengeRepository: challengeRepositoryStub,
        versionRepository: versionRepositoryStub,
      });

      // then
      expect(challengeRepositoryStub.findActiveFlashCompatible).to.have.been.calledOnceWithExactly({
        locale,
        version,
      });
    });
  });
});
