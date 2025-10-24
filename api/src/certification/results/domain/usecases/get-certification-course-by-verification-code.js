/**
 * @typedef {import ('../../domain/usecases/index.js').CertificationCourseRepository} CertificationCourseRepository
 */

/**
 * @param {Object} params
 * @param {string} params.verificationCode
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 */
export const getCertificationCourseByVerificationCode = async function ({
  verificationCode,
  certificationCourseRepository,
}) {
  return certificationCourseRepository.getByVerificationCode({ verificationCode });
};
