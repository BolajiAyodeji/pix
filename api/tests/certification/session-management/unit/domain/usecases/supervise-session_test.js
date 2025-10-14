import {
  CertificationCenterIsArchivedError,
  InvalidSessionSupervisingLoginError,
  SessionNotAccessible,
} from '../../../../../../src/certification/session-management/domain/errors.js';
import { superviseSession } from '../../../../../../src/certification/session-management/domain/usecases/supervise-session.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | supervise-session', function () {
  let sessionRepository;
  let supervisorAccessRepository;
  let certificationCenterRepository;
  let certificationCenterAccessRepository;

  beforeEach(function () {
    sessionRepository = {
      get: sinon.stub(),
    };
    supervisorAccessRepository = {
      create: sinon.stub(),
    };
    certificationCenterRepository = {
      getBySessionId: sinon.stub(),
    };
    certificationCenterAccessRepository = {
      getCertificationCenterAccess: sinon.stub(),
    };
  });

  it('should throw a InvalidSessionSupervisingLoginError when the supervised password is wrong', async function () {
    // given
    const sessionId = 123;
    const invigilatorPassword = 'NOT_MATCHING_INVIGILATOR_PASSWORD';
    const certificationCenter = domainBuilder.buildCertificationCenter();
    const session = domainBuilder.certification.sessionManagement.buildSession({
      id: sessionId,
      certificationCenterId: certificationCenter.id,
    });
    const userId = 434;

    sessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves(certificationCenter);
    certificationCenterAccessRepository.getCertificationCenterAccess.resolves(
      domainBuilder.certification.sessionManagement.buildAllowedCertificationCenterAccess(),
    );

    // when
    const error = await catchErr(superviseSession)({
      sessionId,
      invigilatorPassword,
      userId,
      sessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
      certificationCenterAccessRepository,
    });

    // then
    expect(error).to.be.an.instanceOf(InvalidSessionSupervisingLoginError);
    expect(error.message).to.equal('Le numéro de session et/ou le mot de passe saisis sont incorrects.');
  });

  it('should throw a SessionNotAccessible when the session is not accessible', async function () {
    // given
    const sessionId = 123;
    const certificationCenter = domainBuilder.buildCertificationCenter();
    const session = domainBuilder.certification.sessionManagement.buildSession.processed({ id: sessionId });
    const userId = 434;

    sessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves(certificationCenter);
    certificationCenterAccessRepository.getCertificationCenterAccess.resolves(
      domainBuilder.certification.sessionManagement.buildAllowedCertificationCenterAccess(),
    );

    // when
    const error = await catchErr(superviseSession)({
      sessionId,
      invigilatorPassword: session.invigilatorPassword,
      userId,
      sessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
      certificationCenterAccessRepository,
    });

    // then
    expect(error).to.be.an.instanceOf(SessionNotAccessible);
  });

  it('should a Certification center is archived error when certification center is archived', async function () {
    // given
    const sessionId = 123;
    const session = domainBuilder.certification.sessionManagement.buildSession.created({ id: sessionId });
    const userId = 434;

    sessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves({ archivedAt: new Date(), archivedBy: 1234 });
    certificationCenterAccessRepository.getCertificationCenterAccess.resolves(
      domainBuilder.certification.sessionManagement.buildAllowedCertificationCenterAccess(),
    );

    // when
    const error = await catchErr(superviseSession)({
      sessionId,
      invigilatorPassword: session.invigilatorPassword,
      userId,
      sessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
      certificationCenterAccessRepository,
    });

    // then
    expect(error).to.be.an.instanceOf(CertificationCenterIsArchivedError);
  });

  context('when certification center has SCO blocked access', function () {
    it('should throw SessionNotAccessible when college is blocked', async function () {
      // given
      const sessionId = 123;
      const certificationCenterId = 456;
      const session = domainBuilder.certification.sessionManagement.buildSession.created({ id: sessionId });
      const userId = 434;
      const certificationCenter = domainBuilder.buildCertificationCenter({ id: certificationCenterId });
      const blockedCertificationCenterAccess =
        domainBuilder.certification.sessionManagement.buildAllowedCertificationCenterAccess({
          isAccessBlockedCollege: true,
          pixCertifScoBlockedAccessDateCollege: '2021-01-01',
        });

      sessionRepository.get.resolves(session);
      certificationCenterRepository.getBySessionId.resolves(certificationCenter);
      certificationCenterAccessRepository.getCertificationCenterAccess.resolves(blockedCertificationCenterAccess);

      // when
      const error = await catchErr(superviseSession)({
        sessionId,
        invigilatorPassword: session.invigilatorPassword,
        userId,
        sessionRepository,
        supervisorAccessRepository,
        certificationCenterRepository,
        certificationCenterAccessRepository,
      });

      // then
      expect(error).to.be.an.instanceOf(SessionNotAccessible);
    });
  });

  it('should create a supervisor access', async function () {
    // given
    const sessionId = 123;
    const userId = 434;
    const session = domainBuilder.certification.sessionManagement.buildSession.created({ id: sessionId });

    sessionRepository.get.resolves(session);
    certificationCenterRepository.getBySessionId.resolves({ archivedAt: null, archivedBy: null });
    certificationCenterAccessRepository.getCertificationCenterAccess.resolves(
      domainBuilder.certification.sessionManagement.buildAllowedCertificationCenterAccess(),
    );

    // when
    await superviseSession({
      sessionId,
      invigilatorPassword: session.invigilatorPassword,
      userId,
      sessionRepository,
      supervisorAccessRepository,
      certificationCenterRepository,
      certificationCenterAccessRepository,
    });

    // then
    expect(supervisorAccessRepository.create).to.have.been.calledWithExactly({ sessionId, userId });
  });
});
