import { createCertificationVersion } from '../../../../../../src/certification/configuration/domain/usecases/create-consolidated-framework.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { FRENCH_FRANCE, FRENCH_SPOKEN } from '../../../../../../src/shared/domain/services/locale-service.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Configuration | Unit | UseCase | create-certification-version', function () {
  let challengeRepository, consolidatedFrameworkRepository, tubeRepository, skillRepository;

  beforeEach(function () {
    tubeRepository = {
      findActiveByRecordIds: sinon.stub(),
    };
    skillRepository = {
      findActiveByRecordIds: sinon.stub(),
    };
    challengeRepository = {
      findValidatedBySkills: sinon.stub(),
    };
    consolidatedFrameworkRepository = {
      create: sinon.stub(),
    };
  });

  it('should create a new certification version', async function () {
    // given
    const scope = Frameworks.PIX_PLUS_PRO_SANTE;

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

    tubeRepository.findActiveByRecordIds.resolves([tube1, tube2]);
    skillRepository.findActiveByRecordIds.resolves([...tube1.skills, ...tube2.skills]);
    challengeRepository.findValidatedBySkills.resolves(frFrChallenges);
    consolidatedFrameworkRepository.create.resolves();
    sinon.useFakeTimers({ now: new Date('2019-01-01T05:06:07Z'), toFake: ['Date'] });
    const version = '20190101050607';

    // when
    await createCertificationVersion({
      scope,
      tubeIds,
      tubeRepository,
      skillRepository,
      challengeRepository,
      consolidatedFrameworkRepository,
    });

    // then
    expect(tubeRepository.findActiveByRecordIds).to.have.been.calledOnceWithExactly(tubeIds, FRENCH_SPOKEN);
    expect(skillRepository.findActiveByRecordIds).to.have.been.calledOnceWithExactly([
      ...tube1.skillIds,
      ...tube2.skillIds,
    ]);
    expect(challengeRepository.findValidatedBySkills).to.have.been.calledOnceWithExactly(
      [...tube1.skills, ...tube2.skills],
      FRENCH_FRANCE,
    );
    expect(consolidatedFrameworkRepository.create).to.have.been.calledOnceWithExactly({
      complementaryCertificationKey: scope,
      challenges: frFrChallenges,
      version,
    });
  });
});
