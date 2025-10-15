import { InvigilatorSession } from '../../../../../../src/certification/session-management/domain/read-models/InvigilatorSession.js';
import { expect } from '../../../../../test-helper.js';

describe('Unit | Certification | Session | Domain | Models | InvigilatorSession', function () {
  context('#isAccessible', function () {
    it(`returns true when the session doesn't have finalized date`, function () {
      // given
      const invigilatorSession = new InvigilatorSession({ finalizedAt: null });

      // when
      const isAccessible = invigilatorSession.isAccessible();

      // then
      expect(isAccessible).to.be.true;
    });

    it('returns false when the session has finalized date', function () {
      // given
      const invigilatorSession = new InvigilatorSession({ finalizedAt: new Date() });

      // when
      const isAccessible = invigilatorSession.isAccessible();

      // then
      expect(isAccessible).to.be.false;
    });
  });

  context('#checkPassword', function () {
    it('should return true when the invigilator password match', function () {
      // given
      const invigilatorSession = new InvigilatorSession({ invigilatorPassword: 'MATCHING-SUPERVISOR_PASSWORD' });

      // when
      const checkPassword = invigilatorSession.checkPassword('MATCHING-SUPERVISOR_PASSWORD');

      // then
      expect(checkPassword).to.be.true;
    });

    it('should return false when the invigilator password does not match', function () {
      // given
      const invigilatorSession = new InvigilatorSession({ invigilatorPassword: 'MATCHING-SUPERVISOR_PASSWORD' });

      // when
      const checkPassword = invigilatorSession.checkPassword('NOT_MATCHING-SUPERVISOR_PASSWORD');

      // then
      expect(checkPassword).to.be.false;
    });
  });
});
