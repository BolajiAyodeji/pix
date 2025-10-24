/**
 * @param {Object} params
 * @param {number} params.certificationCourseId
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 */
const getCertificationCourseVersion = async function ({ certificationCourseId, certificationCourseRepository }) {
  return certificationCourseRepository.getVersion({ certificationCourseId });
};

export { getCertificationCourseVersion };
