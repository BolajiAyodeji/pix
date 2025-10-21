import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { Version } from '../../../../../../src/certification/shared/domain/models/Version.js';
import * as versionsRepository from '../../../../../../src/certification/shared/infrastructure/repositories/versions-repository.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect } from '../../../../../test-helper.js';

describe('Certification | Shared | Integration | Repository | Versions', function () {
  describe('#findLatestByScope', function () {
    it('should return the current version for the given scope', async function () {
      // given
      const scope = Frameworks.PIX_PLUS_DROIT;

      databaseBuilder.factory.buildCertificationVersion({
        scope,
        startDate: new Date('2025-01-01'),
        expirationDate: new Date('2025-05-31'),
        assessmentDuration: 90,
        globalScoringConfiguration: [{ config: 'old' }],
        competencesScoringConfiguration: [{ config: 'old' }],
        challengesConfiguration: { config: 'old' },
      });

      databaseBuilder.factory.buildCertificationVersion({
        scope,
        startDate: new Date('2025-03-01'),
        expirationDate: new Date('2025-08-31'),
        assessmentDuration: 100,
        globalScoringConfiguration: [{ config: 'middle' }],
        competencesScoringConfiguration: [{ config: 'middle' }],
        challengesConfiguration: { config: 'middle' },
      });

      const expectedVersionId = databaseBuilder.factory.buildCertificationVersion({
        scope,
        startDate: new Date('2025-06-01'),
        expirationDate: null,
        assessmentDuration: 120,
        globalScoringConfiguration: [{ config: 'latest' }],
        competencesScoringConfiguration: [{ config: 'latest' }],
        challengesConfiguration: { config: 'latest' },
      }).id;

      const aScopeWeAreNotInterestedIn = Frameworks.CORE;
      databaseBuilder.factory.buildCertificationVersion({
        scope: aScopeWeAreNotInterestedIn,
        startDate: new Date('2025-10-01'),
        expirationDate: null,
        assessmentDuration: 150,
        globalScoringConfiguration: [{ other: 'scope' }],
        competencesScoringConfiguration: null,
        challengesConfiguration: { config: 'other' },
      });

      await databaseBuilder.commit();

      // when
      const result = await versionsRepository.findLatestByScope({ scope });

      // then
      expect(result).to.be.instanceOf(Version);
      expect(result.id).to.equal(expectedVersionId);
      expect(result.scope).to.equal(scope);
      expect(result.startDate).to.deep.equal(new Date('2025-06-01'));
      expect(result.expirationDate).to.be.null;
      expect(result.assessmentDuration).to.equal(120);
      expect(result.globalScoringConfiguration).to.deep.equal([{ config: 'latest' }]);
      expect(result.competencesScoringConfiguration).to.deep.equal([{ config: 'latest' }]);
      expect(result.challengesConfiguration).to.deep.equal({ config: 'latest' });
    });

    context('when no version exists for the scope', function () {
      it('should return null', async function () {
        // given
        const scope = Frameworks.PIX_PLUS_EDU_CPE;

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
        const result = await versionsRepository.findLatestByScope({ scope });

        // then
        expect(result).to.be.null;
      });
    });
  });
});
