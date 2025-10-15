import {
  CertificationCenterIsArchivedError,
  InvalidSessionSupervisingLoginError,
  SessionNotAccessible,
} from '../../../../../../src/certification/session-management/domain/errors.js';
import { InvigilatorSession } from '../../../../../../src/certification/session-management/domain/read-models/InvigilatorSession.js';
import { superviseSession } from '../../../../../../src/certification/session-management/domain/usecases/supervise-session.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | supervise-session', function () {
  let invigilatorSessionRepository;
  let supervisorAccessRepository;
  let certificationCenterRepository;

  beforeEach(function () {
    sinon.stub(DomainTransaction, 'execute').callsFake((callback) => {
      return callback();
    });
    invigilatorSessionRepository = {
      get: sinon.stub(),
    };
    supervisorAccessRepository = {
      create: sinon.stub(),
    };
    certificationCenterRepository = {
      getBySessionId: sinon.stub(),
    };
  });

  it('should throw a InvalidSessionSupervisingLoginError when the supervised password is wrong', async function () {
    // given
    const sessionId = 123;
    const invigilatorPassword = 'NOT_MATCHING_INVIGILATOR_PASSWORD';
    const certificationCenter = domainBuilder.buildCertificationCenter();
    const session = new InvigilatorSession({
      finalizedAt: null,
      invigilatorPassword: 'CORRECT_PASSWORD',
    });
    const userId = 434;

    invigilatorSessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves(certificationCenter);

    // when
    const error = await catchErr(superviseSession)({
      sessionId,
      invigilatorPassword,
      userId,
      invigilatorSessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
    });

    // then
    expect(error).to.be.an.instanceOf(InvalidSessionSupervisingLoginError);
    expect(error.message).to.equal('Le numéro de session et/ou le mot de passe saisis sont incorrects.');
  });

  it('should throw a SessionNotAccessible when the session is not accessible', async function () {
    // given
    const sessionId = 123;
    const certificationCenter = domainBuilder.buildCertificationCenter();
    const session = new InvigilatorSession({
      finalizedAt: new Date(),
      invigilatorPassword: 'PASSWORD',
    });
    const userId = 434;

    invigilatorSessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves(certificationCenter);

    // when
    const error = await catchErr(superviseSession)({
      sessionId,
      invigilatorPassword: session.invigilatorPassword,
      userId,
      invigilatorSessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
    });

    // then
    expect(error).to.be.an.instanceOf(SessionNotAccessible);
  });

  it('should a Certification center is archived error when certification center is archived', async function () {
    // given
    const sessionId = 123;
    const session = new InvigilatorSession({
      finalizedAt: null,
      invigilatorPassword: 'PASSWORD',
    });
    const userId = 434;

    invigilatorSessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves({ archivedAt: new Date(), archivedBy: 1234 });

    // when
    const error = await catchErr(superviseSession)({
      sessionId,
      invigilatorPassword: session.invigilatorPassword,
      userId,
      invigilatorSessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
    });

    // then
    expect(error).to.be.an.instanceOf(CertificationCenterIsArchivedError);
  });

  it('should create a supervisor access', async function () {
    // given
    const sessionId = 123;
    const userId = 434;
    const session = new InvigilatorSession({
      finalizedAt: null,
      invigilatorPassword: 'PASSWORD',
    });

    invigilatorSessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves({ archivedAt: null, archivedBy: null });

    // when
    await superviseSession({
      sessionId,
      invigilatorPassword: session.invigilatorPassword,
      userId,
      invigilatorSessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
    });

    // then
    expect(supervisorAccessRepository.create).to.have.been.calledWithExactly({ sessionId, userId });
  });
});
