import { Version } from '../../../../../../src/certification/configuration/domain/models/Version.js';
import * as versionsRepository from '../../../../../../src/certification/configuration/infrastructure/repositories/versions-repository.js';
import { DEFAULT_SESSION_DURATION_MINUTES } from '../../../../../../src/certification/shared/domain/constants.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { databaseBuilder, domainBuilder, expect, knex } from '../../../../../test-helper.js';

describe('Certification | Configuration | Integration | Repository | Versions', function () {
  describe('#create', function () {
    it('should create a certification version and link challenges', async function () {
      // given
      const version = domainBuilder.certification.configuration.buildConfigurationVersion({
        scope: Frameworks.PIX_PLUS_DROIT,
        startDate: new Date('2025-06-01'),
        expirationDate: new Date('2025-12-31'),
        assessmentDuration: DEFAULT_SESSION_DURATION_MINUTES,
        globalScoringConfiguration: [{ meshLevel: 0, bounds: { min: -8, max: -1.4 } }],
        competencesScoringConfiguration: [
          {
            competence: '1.1',
            values: [{ bounds: { max: -2, min: -10 }, competenceLevel: 0 }],
          },
        ],
        challengesConfiguration: { maximumAssessmentLength: 32, limitToOneQuestionPerTube: true },
      });

      databaseBuilder.factory.buildComplementaryCertification({ key: version.scope });
      const challenge1 = databaseBuilder.factory.learningContent.buildChallenge({ id: 'challenge1' });
      const challenge2 = databaseBuilder.factory.learningContent.buildChallenge({ id: 'challenge2' });

      await databaseBuilder.commit();

      // when
      const versionId = await versionsRepository.create({ version, challenges: [challenge1, challenge2] });

      // then
      const results = await knex('certification_versions').where({ scope: version.scope }).first();

      expect(results).to.deep.equal({
        id: versionId,
        scope: version.scope,
        startDate: version.startDate,
        expirationDate: version.expirationDate,
        assessmentDuration: version.assessmentDuration,
        globalScoringConfiguration: version.globalScoringConfiguration,
        competencesScoringConfiguration: version.competencesScoringConfiguration,
        challengesConfiguration: version.challengesConfiguration,
      });

      const linkedChallenges = await knex('certification-frameworks-challenges')
        .where({ versionId })
        .orderBy('challengeId');

      expect(linkedChallenges).to.have.lengthOf(2);
      expect(linkedChallenges[0]).to.include({
        complementaryCertificationKey: version.scope,
        challengeId: challenge1.id,
        version: String(versionId),
        versionId,
      });
      expect(linkedChallenges[1]).to.include({
        complementaryCertificationKey: version.scope,
        challengeId: challenge2.id,
        version: String(versionId),
        versionId,
      });
    });
  });

  describe('#update', function () {
    it('should update the expiration date of a certification version', async function () {
      // given
      const existingVersion = databaseBuilder.factory.buildCertificationVersion({
        scope: Frameworks.PIX_PLUS_DROIT,
        startDate: new Date('2024-01-01'),
        expirationDate: null,
        assessmentDuration: DEFAULT_SESSION_DURATION_MINUTES,
        challengesConfiguration: {},
      });

      await databaseBuilder.commit();

      const newExpirationDate = new Date('2025-10-21T10:00:00Z');
      const versionToUpdate = domainBuilder.certification.configuration.buildConfigurationVersion({
        id: existingVersion.id,
        scope: existingVersion.scope,
        startDate: existingVersion.startDate,
        expirationDate: newExpirationDate,
        assessmentDuration: existingVersion.assessmentDuration,
        challengesConfiguration: JSON.parse(existingVersion.challengesConfiguration),
      });

      // when
      await versionsRepository.update({ version: versionToUpdate });

      // then
      const updatedVersion = await knex('certification_versions').where({ id: existingVersion.id }).first();

      expect(updatedVersion.expirationDate).to.deep.equal(newExpirationDate);
      expect(updatedVersion.scope).to.equal(existingVersion.scope);
      expect(updatedVersion.startDate).to.deep.equal(existingVersion.startDate);
    });
  });

  describe('#findActiveByScope', function () {
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
      const result = await versionsRepository.findActiveByScope({ scope });

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
        const result = await versionsRepository.findActiveByScope({ scope });

        // then
        expect(result).to.be.null;
      });
    });
  });
});
