//@ts-check
/**
 * @typedef {import('./index.js').SessionRepository} SessionRepository
 * @typedef {import('./index.js').SupervisorAccessRepository} SupervisorAccessRepository
 * @typedef {import('./index.js').CertificationCenterRepository} CertificationCenterRepository
 * @typedef {import('./index.js').CertificationCenterAccessRepository} CertificationCenterAccessRepository
 */

import {
  CertificationCenterIsArchivedError,
  InvalidSessionSupervisingLoginError,
  SessionNotAccessible,
} from '../errors.js';

/**
 * @param {Object} params
 * @param {number} params.sessionId
 * @param {string} params.invigilatorPassword
 * @param {number} params.userId
 * @param {SessionRepository} params.sessionRepository
 * @param {SupervisorAccessRepository} params.supervisorAccessRepository
 * @param {CertificationCenterRepository} params.certificationCenterRepository
 * @param {CertificationCenterAccessRepository} params.certificationCenterAccessRepository
 */
export const superviseSession = async ({
  sessionId,
  invigilatorPassword,
  userId,
  sessionRepository,
  supervisorAccessRepository,
  certificationCenterRepository,
  certificationCenterAccessRepository,
}) => {
  // should use a specific get from sessionRepository instead
  const session = await sessionRepository.get({ id: sessionId });

  const certificationCenter = await certificationCenterRepository.getBySessionId({ sessionId });

  const certificationCenterAccess = await certificationCenterAccessRepository.getCertificationCenterAccess({
    certificationCenterId: certificationCenter.id,
  });

  if (certificationCenterAccess.isAccessBlockedCollege) {
    throw new SessionNotAccessible(certificationCenterAccess.pixCertifScoBlockedAccessDateCollege);
  }

  if (certificationCenterAccess.isAccessBlockedLycee) {
    throw new SessionNotAccessible(certificationCenterAccess.pixCertifScoBlockedAccessDateLycee);
  }

  if (certificationCenterAccess.isAccessBlockedAEFE) {
    throw new SessionNotAccessible(certificationCenterAccess.pixCertifScoBlockedAccessDateLycee);
  }

  if (certificationCenterAccess.isAccessBlockedAgri) {
    throw new SessionNotAccessible(certificationCenterAccess.pixCertifScoBlockedAccessDateLycee);
  }

  if (!session.isSupervisable(invigilatorPassword)) {
    throw new InvalidSessionSupervisingLoginError();
  }

  if (!session.isAccessible()) {
    throw new SessionNotAccessible();
  }

  if (certificationCenter.archivedAt || certificationCenter.archivedBy) {
    throw new CertificationCenterIsArchivedError();
  }

  await supervisorAccessRepository.create({ sessionId, userId });
};
