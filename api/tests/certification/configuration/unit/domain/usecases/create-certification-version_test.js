import { createCertificationVersion } from '../../../../../../src/certification/configuration/domain/usecases/create-certification-version.js';
import { DEFAULT_SESSION_DURATION_MINUTES } from '../../../../../../src/certification/shared/domain/constants.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { Version } from '../../../../../../src/certification/shared/domain/models/Version.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { FRENCH_FRANCE, FRENCH_SPOKEN } from '../../../../../../src/shared/domain/services/locale-service.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Configuration | Unit | UseCase | create-certification-version', function () {
  let challengeRepository, sharedVersionsRepository, versionsRepository, tubeRepository, skillRepository;

  beforeEach(function () {
    sinon.stub(DomainTransaction, 'execute').callsFake((callback) => {
      return callback();
    });

    tubeRepository = {
      findActiveByRecordIds: sinon.stub(),
    };
    skillRepository = {
      findActiveByRecordIds: sinon.stub(),
    };
    challengeRepository = {
      findValidatedBySkills: sinon.stub(),
    };
    sharedVersionsRepository = {
      findLatestByScope: sinon.stub(),
    };
    versionsRepository = {
      create: sinon.stub(),
      updateExpirationDate: sinon.stub(),
    };
  });

  context('when a previous version exists', function () {
    it('should create a new certification version that takes place as the latest one', async function () {
      // given
      const clock = sinon.useFakeTimers({ now: new Date('2025-10-21T10:00:00Z'), toFake: ['Date'] });
      const scope = Frameworks.PIX_PLUS_PRO_SANTE;

      const currentVersion = domainBuilder.certification.shared.buildVersion({
        id: 123,
        scope,
        startDate: new Date('2024-01-01'),
        expirationDate: null,
        assessmentDuration: DEFAULT_SESSION_DURATION_MINUTES,
        globalScoringConfiguration: [{ meshLevel: 0, bounds: { min: -8, max: -1.4 } }],
        competencesScoringConfiguration: [
          { competence: '1.1', values: [{ bounds: { max: -2, min: -10 }, competenceLevel: 0 }] },
        ],
        challengesConfiguration: { maximumAssessmentLength: 32, limitToOneQuestionPerTube: true },
      });

      const tube1 = domainBuilder.buildTube({
        id: 'recTube1',
        skills: [domainBuilder.buildSkill({ id: 'skill1' }), domainBuilder.buildSkill({ id: 'skill2' })],
      });
      const tube2 = domainBuilder.buildTube({ id: 'recTube2', skills: [domainBuilder.buildSkill({ id: 'skill3' })] });
      const tubeIds = [tube1.id, tube2.id];

      const challenges = [
        domainBuilder.buildChallenge({ id: 'challenge1', locales: ['fr-fr'] }),
        domainBuilder.buildChallenge({ id: 'challenge2', locales: ['fr-fr', 'fr-be'] }),
        domainBuilder.buildChallenge({ id: 'challenge3', locales: ['fr', 'fr-fr'] }),
        domainBuilder.buildChallenge({ id: 'challenge4', locales: ['fr'] }),
        domainBuilder.buildChallenge({ id: 'challenge5', locales: ['fr-be'] }),
      ];
      const frFrChallenges = challenges.filter((challenge) => challenge.locales.includes(FRENCH_FRANCE));

      sharedVersionsRepository.findLatestByScope.resolves(currentVersion);
      tubeRepository.findActiveByRecordIds.resolves([tube1, tube2]);
      skillRepository.findActiveByRecordIds.resolves([...tube1.skills, ...tube2.skills]);
      challengeRepository.findValidatedBySkills.resolves(frFrChallenges);
      versionsRepository.create.resolves();

      // when
      await createCertificationVersion({
        scope,
        tubeIds,
        tubeRepository,
        skillRepository,
        challengeRepository,
        sharedVersionsRepository,
        versionsRepository,
      });

      // then
      expect(sharedVersionsRepository.findLatestByScope).to.have.been.calledOnceWithExactly({ scope });
      expect(versionsRepository.updateExpirationDate).to.have.been.calledOnce;
      const expiredVersionArg = versionsRepository.updateExpirationDate.firstCall.args[0].version;
      expect(expiredVersionArg).to.be.instanceOf(Version);
      expect(expiredVersionArg.id).to.equal(currentVersion.id);
      expect(expiredVersionArg.expirationDate).to.deep.equal(new Date('2025-10-21T10:00:00Z'));
      expect(tubeRepository.findActiveByRecordIds).to.have.been.calledOnceWithExactly(tubeIds, FRENCH_SPOKEN);
      expect(skillRepository.findActiveByRecordIds).to.have.been.calledOnceWithExactly([
        ...tube1.skillIds,
        ...tube2.skillIds,
      ]);
      expect(challengeRepository.findValidatedBySkills).to.have.been.calledOnceWithExactly(
        [...tube1.skills, ...tube2.skills],
        FRENCH_FRANCE,
      );
      expect(versionsRepository.create).to.have.been.calledOnce;
      const { version, challenges: passedChallenges } = versionsRepository.create.firstCall.args[0];
      expect(version).to.deepEqualInstance(
        new Version({
          scope,
          startDate: new Date('2025-10-21T10:00:00Z'),
          expirationDate: null,
          assessmentDuration: currentVersion.assessmentDuration,
          globalScoringConfiguration: undefined,
          competencesScoringConfiguration: undefined,
          challengesConfiguration: currentVersion.challengesConfiguration,
        }),
      );
      expect(passedChallenges).to.deep.equal(frFrChallenges);

      clock.restore();
    });
  });

  context('when there are no previous certification version', function () {
    it('should create a brand new certification version', async function () {
      // given
      const clock = sinon.useFakeTimers({ now: new Date('2025-10-20T10:00:00Z'), toFake: ['Date'] });
      const scope = Frameworks.PIX_PLUS_DROIT;

      const tube1 = domainBuilder.buildTube({
        id: 'recTube1',
        skills: [domainBuilder.buildSkill({ id: 'skill1' }), domainBuilder.buildSkill({ id: 'skill2' })],
      });
      const tube2 = domainBuilder.buildTube({ id: 'recTube2', skills: [domainBuilder.buildSkill({ id: 'skill3' })] });
      const tubeIds = [tube1.id, tube2.id];

      const challenges = [
        domainBuilder.buildChallenge({ id: 'challenge1', locales: ['fr-fr'] }),
        domainBuilder.buildChallenge({ id: 'challenge2', locales: ['fr-fr', 'fr-be'] }),
      ];
      const frFrChallenges = challenges.filter((challenge) => challenge.locales.includes(FRENCH_FRANCE));

      sharedVersionsRepository.findLatestByScope.resolves(null);
      tubeRepository.findActiveByRecordIds.resolves([tube1, tube2]);
      skillRepository.findActiveByRecordIds.resolves([...tube1.skills, ...tube2.skills]);
      challengeRepository.findValidatedBySkills.resolves(frFrChallenges);
      versionsRepository.create.resolves();

      // when
      await createCertificationVersion({
        scope,
        tubeIds,
        tubeRepository,
        skillRepository,
        challengeRepository,
        sharedVersionsRepository,
        versionsRepository,
      });

      // then
      expect(sharedVersionsRepository.findLatestByScope).to.have.been.calledOnceWithExactly({ scope });
      expect(tubeRepository.findActiveByRecordIds).to.have.been.calledOnceWithExactly(tubeIds, FRENCH_SPOKEN);
      expect(skillRepository.findActiveByRecordIds).to.have.been.calledOnceWithExactly([
        ...tube1.skillIds,
        ...tube2.skillIds,
      ]);
      expect(challengeRepository.findValidatedBySkills).to.have.been.calledOnceWithExactly(
        [...tube1.skills, ...tube2.skills],
        FRENCH_FRANCE,
      );
      expect(versionsRepository.create).to.have.been.calledOnce;
      const { version, challenges: passedChallenges } = versionsRepository.create.firstCall.args[0];
      expect(version).to.deepEqualInstance(
        new Version({
          scope,
          startDate: new Date('2025-10-20T10:00:00Z'),
          expirationDate: null,
          assessmentDuration: DEFAULT_SESSION_DURATION_MINUTES,
          challengesConfiguration: {},
        }),
      );
      expect(passedChallenges).to.deep.equal(frFrChallenges);

      clock.restore();
    });
  });
});
