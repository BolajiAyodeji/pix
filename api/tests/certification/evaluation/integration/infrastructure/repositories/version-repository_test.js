import { Version } from '../../../../../../src/certification/evaluation/domain/models/Version.js';
import * as versionRepository from '../../../../../../src/certification/evaluation/infrastructure/repositories/version-repository.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
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

  describe('#getByScopeAndReconciliationDate', function () {
    it('should return the most recent version before or equal to the reconciliation date', async function () {
      // given
      const reconciliationDate = new Date('2025-06-15');
      const scope = Frameworks.CORE;

      databaseBuilder.factory.buildCertificationVersion({
        scope,
        startDate: new Date('2025-01-01'),
        expirationDate: new Date('2025-05-31'),
        assessmentDuration: 90,
        globalScoringConfiguration: [{ config: 'old' }],
        competencesScoringConfiguration: [{ config: 'old' }],
        challengesConfiguration: { config: 'old' },
      }).id;

      const expectedVersionId = databaseBuilder.factory.buildCertificationVersion({
        scope,
        startDate: new Date('2025-06-01'),
        expirationDate: null,
        assessmentDuration: 120,
        globalScoringConfiguration: [{ config: 'current' }],
        competencesScoringConfiguration: [{ config: 'current' }],
        challengesConfiguration: { config: 'current' },
      }).id;

      databaseBuilder.factory.buildCertificationVersion({
        scope,
        startDate: new Date('2025-07-01'),
        expirationDate: null,
        assessmentDuration: 150,
        globalScoringConfiguration: [{ config: 'future' }],
        competencesScoringConfiguration: [{ config: 'future' }],
        challengesConfiguration: { config: 'future' },
      });

      await databaseBuilder.commit();

      // when
      const result = await versionRepository.getByScopeAndReconciliationDate({
        scope,
        reconciliationDate,
      });

      // then
      expect(result).to.be.instanceOf(Version);
      expect(result.id).to.equal(expectedVersionId);
      expect(result.scope).to.equal(scope);
      expect(result.challengesConfiguration).to.deep.equal({ config: 'current' });
    });

    it('should only consider versions of the specified scope', async function () {
      // given
      const reconciliationDate = new Date('2025-06-15');
      const targetScope = Frameworks.PIX_PLUS_PRO_SANTE;
      const otherScope = Frameworks.CORE;

      const expectedVersionId = databaseBuilder.factory.buildCertificationVersion({
        scope: targetScope,
        startDate: new Date('2025-05-01'),
        expirationDate: null,
        assessmentDuration: 100,
        globalScoringConfiguration: [{ target: 'scope' }],
        competencesScoringConfiguration: null,
        challengesConfiguration: { config: 'target' },
      }).id;

      databaseBuilder.factory.buildCertificationVersion({
        scope: otherScope,
        startDate: new Date('2025-06-10'),
        expirationDate: null,
        assessmentDuration: 150,
        globalScoringConfiguration: [{ other: 'scope' }],
        competencesScoringConfiguration: null,
        challengesConfiguration: { config: 'other' },
      });

      await databaseBuilder.commit();

      // when
      const result = await versionRepository.getByScopeAndReconciliationDate({
        scope: targetScope,
        reconciliationDate,
      });

      // then
      expect(result).to.be.instanceOf(Version);
      expect(result.id).to.equal(expectedVersionId);
      expect(result.scope).to.equal(targetScope);
      expect(result.challengesConfiguration).to.deep.equal({ config: 'target' });
    });

    context('when reconciliation date equals startDate', function () {
      it('should return the exact version', async function () {
        // given
        const reconciliationDate = new Date('2025-06-01');
        const scope = Frameworks.PIX_PLUS_DROIT;

        const expectedVersionId = databaseBuilder.factory.buildCertificationVersion({
          scope,
          startDate: reconciliationDate,
          expirationDate: null,
          assessmentDuration: 100,
          globalScoringConfiguration: null,
          competencesScoringConfiguration: null,
          challengesConfiguration: { minChallenges: 5 },
        }).id;

        await databaseBuilder.commit();

        // when
        const result = await versionRepository.getByScopeAndReconciliationDate({
          scope,
          reconciliationDate,
        });

        // then
        expect(result).to.be.instanceOf(Version);
        expect(result.id).to.equal(expectedVersionId);
        expect(result.challengesConfiguration).to.deep.equal({ minChallenges: 5 });
      });
    });

    context('when no version exists for the scope', function () {
      it('should throw a NotFoundError', async function () {
        // given
        const reconciliationDate = new Date('2025-06-15');
        const scope = Frameworks.PIX_PLUS_EDU_1ER_DEGRE;

        databaseBuilder.factory.buildCertificationVersion({
          scope: Frameworks.CORE,
          startDate: new Date('2025-01-01'),
          expirationDate: null,
          assessmentDuration: 90,
          globalScoringConfiguration: null,
          competencesScoringConfiguration: null,
          challengesConfiguration: { config: 'test' },
        });

        await databaseBuilder.commit();

        // when
        const error = await catchErr(versionRepository.getByScopeAndReconciliationDate)({
          scope,
          reconciliationDate,
        });

        // then
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal(
          'No certification framework version found for the given scope and reconciliationDate',
        );
      });
    });

    context('when all versions are after the reconciliation date', function () {
      it('should throw a NotFoundError', async function () {
        // given
        const reconciliationDate = new Date('2024-12-31');
        const scope = Frameworks.PIX_PLUS_EDU_2ND_DEGRE;

        databaseBuilder.factory.buildCertificationVersion({
          scope,
          startDate: new Date('2025-01-01'),
          expirationDate: null,
          assessmentDuration: 90,
          globalScoringConfiguration: null,
          competencesScoringConfiguration: null,
          challengesConfiguration: { config: 'test' },
        });

        databaseBuilder.factory.buildCertificationVersion({
          scope,
          startDate: new Date('2025-06-01'),
          expirationDate: null,
          assessmentDuration: 120,
          globalScoringConfiguration: null,
          competencesScoringConfiguration: null,
          challengesConfiguration: { config: 'test' },
        });

        await databaseBuilder.commit();

        // when
        const error = await catchErr(versionRepository.getByScopeAndReconciliationDate)({
          scope,
          reconciliationDate,
        });

        // then
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal(
          'No certification framework version found for the given scope and reconciliationDate',
        );
      });
    });
  });
});
