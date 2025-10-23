import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { CertificationCourse } from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { getCertificationCourse } from '../../../../../../src/certification/shared/domain/usecases/get-certification-course.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | get-certification-course', function () {
  let certificationCourse;
  let certificationCourseRepository;
  let versionRepository;
  let version;

  beforeEach(function () {
    certificationCourse = new CertificationCourse({
      id: 'certification_course_id',
      version: AlgorithmEngineVersion.V3,
    });

    certificationCourseRepository = {
      get: sinon.stub(),
    };

    versionRepository = {
      getByCourseId: sinon.stub(),
    };

    const challengesConfiguration = domainBuilder.buildFlashAlgorithmConfiguration({ maximumAssessmentLength: 42 });
    version = domainBuilder.certification.configuration.buildVersion({ challengesConfiguration });
  });

  it('should get the certificationCourse with numberOfChallenges from version', async function () {
    // given
    certificationCourseRepository.get.withArgs({ id: certificationCourse.getId() }).resolves(certificationCourse);
    versionRepository.getByCourseId.withArgs(certificationCourse.getId()).resolves(version);

    // when
    const actualCertificationCourse = await getCertificationCourse({
      certificationCourseId: certificationCourse.getId(),
      certificationCourseRepository,
      versionRepository,
    });

    // then
    expect(certificationCourseRepository.get).to.have.been.calledOnceWithExactly({
      id: certificationCourse.getId(),
    });
    expect(versionRepository.getByCourseId).to.have.been.calledOnceWithExactly(certificationCourse.getId());
    expect(actualCertificationCourse.getNumberOfChallenges()).to.equal(42);
    expect(actualCertificationCourse.getId()).to.equal(certificationCourse.getId());
  });
});
