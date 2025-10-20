import * as versionsRepository from '../../../../../../src/certification/configuration/infrastructure/repositories/versions-repository.js';
import { DEFAULT_SESSION_DURATION_MINUTES } from '../../../../../../src/certification/shared/domain/constants.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { databaseBuilder, domainBuilder, expect, knex } from '../../../../../test-helper.js';

describe('Certification | Configuration | Integration | Repository | Versions', function () {
  describe('#create', function () {
    it('should create a certification version and link challenges', async function () {
      // given
      const version = domainBuilder.certification.shared.buildVersion({
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
});
