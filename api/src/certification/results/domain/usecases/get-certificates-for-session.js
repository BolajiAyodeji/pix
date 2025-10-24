import compact from 'lodash/compact.js';
import isEmpty from 'lodash/isEmpty.js';

import { NotFoundError } from '../../../../shared/domain/errors.js';
import { PromiseUtils } from '../../../../shared/infrastructure/utils/promise-utils.js';

const getCertificatesForSession = async function ({
  sessionId,
  certificateRepository,
  sharedCertificationCourseRepository,
}) {
  const certificationCourses = await sharedCertificationCourseRepository.findCertificationCoursesBySessionId({
    sessionId,
  });

  if (isEmpty(certificationCourses)) {
    throw new NotFoundError();
  }

  const certificates = compact(
    await PromiseUtils.mapSeries(certificationCourses, async (certificationCourse) => {
      try {
        return await certificateRepository.getCertificate({
          certificationCourseId: certificationCourse.getId(),
        });
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }
    }),
  );

  if (isEmpty(certificates)) {
    throw new NotFoundError('No certificats found');
  }

  return certificates;
};

export { getCertificatesForSession };
