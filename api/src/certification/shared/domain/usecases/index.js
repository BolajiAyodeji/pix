import { injectDependencies } from '../../../../shared/infrastructure/utils/dependency-injection.js';
import * as certificationCourseRepository from '../../../shared/infrastructure/repositories/certification-course-repository.js';
import * as versionRepository from '../../infrastructure/repositories/version-repository.js';

/**
 * @typedef {certificationCourseRepository} CertificationCourseRepository
 * @typedef {versionsRepository} VersionsRepository
 */
const dependencies = {
  certificationCourseRepository,
  versionRepository,
};

import { getCertificationCourse } from './get-certification-course.js';

const usecasesWithoutInjectedDependencies = {
  getCertificationCourse,
};

const usecases = injectDependencies(usecasesWithoutInjectedDependencies, dependencies);

export { usecases };
