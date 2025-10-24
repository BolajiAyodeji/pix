import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { CertificationCourse } from '../../../shared/domain/models/CertificationCourse.js';
import { CertificationCourseVersion } from '../../domain/read-models/CertificationCourseVersion.js';

async function getByVerificationCode({ verificationCode }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationCourse = await knexConn('certification-courses').select('*').where({ verificationCode }).first();

  if (!certificationCourse) {
    throw new NotFoundError(`Certification course does not exist with given verification code`);
  }

  return new CertificationCourse(certificationCourse);
}

async function getVersion({ certificationCourseId }) {
  const knexConn = DomainTransaction.getConnection();

  const result = await knexConn('certification-courses').select('version').where({ id: certificationCourseId }).first();

  if (!result) {
    throw new NotFoundError(`Certification course with id ${certificationCourseId} does not exist`);
  }

  return new CertificationCourseVersion({ version: result.version });
}

export { getByVerificationCode, getVersion };
