/**
 * @param {Object} params
 * @param {number} params.userId
 * @param {import('./index.js').sharedCertificationCourseRepository} params.sharedCertificationCourseRepository
 **/
const findUserCertificationCourses = async function ({ userId, sharedCertificationCourseRepository }) {
  return sharedCertificationCourseRepository.findAllByUserId({ userId });
};

export { findUserCertificationCourses };
