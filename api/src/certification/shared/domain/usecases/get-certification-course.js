/**
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('./index.js').VersionRepository} VersionRepository
 */

/**
 * @param {Object} params
 * @param {number} params.certificationCourseId
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {VersionRepository} params.versionRepository
 */
const getCertificationCourse = async function ({
  certificationCourseId,
  certificationCourseRepository,
  versionRepository,
}) {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });

  if (certificationCourse.isV3()) {
    const version = await versionRepository.getByCourseId(certificationCourseId);

    certificationCourse.setNumberOfChallenges(version.challengesConfiguration.maximumAssessmentLength);
  }

  return certificationCourse;
};

export { getCertificationCourse };
