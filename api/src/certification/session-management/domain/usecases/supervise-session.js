//@ts-check
/**
 * @typedef {import('./index.js').InvigilatorSessionRepository} InvigilatorSessionRepository
 * @typedef {import('./index.js').SupervisorAccessRepository} SupervisorAccessRepository
 * @typedef {import('./index.js').CertificationCenterRepository} CertificationCenterRepository
 */

import { withTransaction } from '../../../../shared/domain/DomainTransaction.js';
import {
  CertificationCenterIsArchivedError,
  InvalidSessionSupervisingLoginError,
  SessionNotAccessible,
} from '../errors.js';

export const superviseSession = withTransaction(
  /**
   * @param {Object} params
   * @param {number} params.sessionId
   * @param {string} params.invigilatorPassword
   * @param {number} params.userId
   * @param {InvigilatorSessionRepository} params.invigilatorSessionRepository
   * @param {SupervisorAccessRepository} params.supervisorAccessRepository
   * @param {CertificationCenterRepository} params.certificationCenterRepository
   */
  async ({
    sessionId,
    invigilatorPassword,
    userId,
    invigilatorSessionRepository,
    supervisorAccessRepository,
    certificationCenterRepository,
  }) => {
    const session = await invigilatorSessionRepository.get({ id: sessionId });

    const certificationCenter = await certificationCenterRepository.getBySessionId({ sessionId });

    if (!session.isAccessible()) {
      throw new SessionNotAccessible();
    }

    if (!session.checkPassword(invigilatorPassword)) {
      throw new InvalidSessionSupervisingLoginError();
    }

    if (certificationCenter.archivedAt || certificationCenter.archivedBy) {
      throw new CertificationCenterIsArchivedError();
    }

    await supervisorAccessRepository.create({ sessionId, userId });
  },
);
