import { getNextChallenge } from '../../../../../../src/certification/evaluation/domain/usecases/get-next-challenge.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { Frameworks } from '../../../../../../src/certification/shared/domain/models/Frameworks.js';
import { config } from '../../../../../../src/shared/config.js';
import { AssessmentEndedError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Domain | Use Cases | get-next-challenge', function () {
  describe('#getNextChallenge', function () {
    let answerRepository,
      sharedChallengeRepository,
      certificationCourseRepository,
      complementaryCertificationRepository,
      certificationChallengeLiveAlertRepository,
      sessionManagementCertificationChallengeRepository,
      pickChallengeService,
      flashAlgorithmService,
      certificationCandidateRepository,
      versionRepository;

    let version;
    let certificationCandidateId;
    let assessment;

    beforeEach(function () {
      versionRepository = {
        getByScopeAndReconciliationDate: sinon.stub(),
      };
      answerRepository = {
        findByAssessmentExcludingChallengeIds: sinon.stub(),
      };
      sharedChallengeRepository = {
        get: sinon.stub(),
        getMany: sinon.stub(),
        findActiveFlashCompatible: sinon.stub(),
      };
      certificationCourseRepository = {
        get: sinon.stub(),
      };
      complementaryCertificationRepository = {
        get: sinon.stub(),
      };
      certificationChallengeLiveAlertRepository = {
        getLiveAlertValidatedChallengeIdsByAssessmentId: sinon.stub(),
      };
      sessionManagementCertificationChallengeRepository = {
        save: sinon.stub(),
        getNextChallengeByCourseId: sinon.stub(),
      };
      pickChallengeService = {
        getChallengePicker: sinon.stub(),
      };
      flashAlgorithmService = {
        getPossibleNextChallenges: sinon.stub(),
        getCapacityAndErrorRate: sinon.stub(),
      };
      certificationCandidateRepository = {
        findByAssessmentId: sinon.stub(),
      };
      assessment = domainBuilder.buildAssessment();
      const candidate = domainBuilder.certification.evaluation.buildCandidate({
        accessibilityAdjustmentNeeded: false,
      });
      certificationCandidateId = candidate.id;

      certificationCandidateRepository.findByAssessmentId.withArgs({ assessmentId: assessment.id }).resolves(candidate);

      version = domainBuilder.certification.evaluation.buildEvaluationVersion().challengesConfiguration;
    });

    context('when there are challenges left to answer', function () {
      it('should save the returned next challenge', async function () {
        // given
        const nextChallengeToAnswer = domainBuilder.buildChallenge({
          blindnessCompatibility: 'KO',
        });
        const locale = 'fr-FR';
        const complementaryCertificationId = 123;
        const complementaryCertification =
          domainBuilder.certification.complementaryCertification.buildComplementaryCertification({
            id: complementaryCertificationId,
            key: ComplementaryCertificationKeys.PIX_PLUS_DROIT,
          });
        const v3CertificationCourseWithComplementary = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
          complementaryCertificationCourse: {
            complementaryCertificationId,
          },
        });

        versionRepository.getByScopeAndReconciliationDate.resolves(version);

        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
          .resolves([]);
        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourseWithComplementary);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [])
          .resolves(null);
        sharedChallengeRepository.get.resolves();

        const reconciledAt = new Date('2024-10-18');
        const candidate = domainBuilder.certification.evaluation.buildCandidate({ reconciledAt });
        certificationCandidateRepository.findByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves(candidate);

        complementaryCertificationRepository.get
          .withArgs({ id: complementaryCertificationId })
          .resolves(complementaryCertification);

        sharedChallengeRepository.findActiveFlashCompatible.resolves([nextChallengeToAnswer]);
        sharedChallengeRepository.getMany.withArgs([]).resolves([]);

        flashAlgorithmService.getCapacityAndErrorRate
          .withArgs({
            allAnswers: [],
            challenges: [nextChallengeToAnswer],
            capacity: config.v3Certification.defaultCandidateCapacity,
            variationPercent: undefined,
          })
          .returns({ capacity: 0 });

        flashAlgorithmService.getPossibleNextChallenges
          .withArgs({
            availableChallenges: [nextChallengeToAnswer],
            capacity: 0,
          })
          .returns([nextChallengeToAnswer]);

        const getChallengePickerImpl = sinon.stub();
        getChallengePickerImpl
          .withArgs({
            possibleChallenges: [nextChallengeToAnswer],
          })
          .returns(nextChallengeToAnswer);
        pickChallengeService.getChallengePicker.withArgs().returns(getChallengePickerImpl);

        // when
        const challenge = await getNextChallenge({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          versionRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          complementaryCertificationRepository,
        });

        // then
        expect(challenge).to.equal(nextChallengeToAnswer);
      });

      context('when candidate needs accessibility adjustment', function () {
        it('should only pick among challenges with no accessibilities issues', async function () {
          // given
          const nextChallengeToAnswer = domainBuilder.buildChallenge({
            blindnessCompatibility: 'RAS',
            colorBlindnessCompatibility: 'OK',
          });
          const accessibleChallenge = domainBuilder.buildChallenge({
            blindnessCompatibility: 'OK',
            colorBlindnessCompatibility: 'RAS',
          });
          const allChallenges = [
            nextChallengeToAnswer,
            accessibleChallenge,
            domainBuilder.buildChallenge({
              blindnessCompatibility: 'autre chose',
              colorBlindnessCompatibility: 'OK',
            }),
          ];
          const v3CertificationCourse = domainBuilder.buildCertificationCourse({
            version: AlgorithmEngineVersion.V3,
          });
          const assessment = domainBuilder.buildAssessment();
          const locale = 'fr-FR';

          versionRepository.getByScopeAndReconciliationDate.resolves(version);

          answerRepository.findByAssessmentExcludingChallengeIds
            .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
            .resolves([]);
          certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
            .withArgs({ assessmentId: assessment.id })
            .resolves([]);

          certificationCourseRepository.get
            .withArgs({ id: assessment.certificationCourseId })
            .resolves(v3CertificationCourse);
          sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
            .withArgs(assessment.certificationCourseId, [])
            .resolves(null);

          const candidateNeedingAccessibilityAdjustment = domainBuilder.certification.evaluation.buildCandidate({
            id: 'candidateNeedingAccessibilityAdjustmentId',
            accessibilityAdjustmentNeeded: true,
          });
          certificationCandidateRepository.findByAssessmentId
            .withArgs({ assessmentId: assessment.id })
            .resolves(candidateNeedingAccessibilityAdjustment);

          sharedChallengeRepository.findActiveFlashCompatible
            .withArgs({
              locale,
              complementaryCertificationKey: undefined,
              version,
            })
            .resolves(allChallenges);

          sharedChallengeRepository.getMany.withArgs([]).resolves([]);

          flashAlgorithmService.getCapacityAndErrorRate
            .withArgs({
              allAnswers: [],
              challenges: [nextChallengeToAnswer, accessibleChallenge],
              capacity: config.v3Certification.defaultCandidateCapacity,
              variationPercent: undefined,
            })
            .returns({ capacity: 0 });

          flashAlgorithmService.getPossibleNextChallenges
            .withArgs({
              availableChallenges: [nextChallengeToAnswer, accessibleChallenge],
              capacity: 0,
            })
            .returns([nextChallengeToAnswer]);

          const getChallengePickerImpl = sinon.stub();
          getChallengePickerImpl
            .withArgs({
              possibleChallenges: [nextChallengeToAnswer],
            })
            .returns(nextChallengeToAnswer);
          pickChallengeService.getChallengePicker.withArgs().returns(getChallengePickerImpl);

          // when
          const challenge = await getNextChallenge({
            answerRepository,
            assessment,
            sessionManagementCertificationChallengeRepository,
            certificationChallengeLiveAlertRepository,
            certificationCourseRepository,
            sharedChallengeRepository,
            versionRepository,
            flashAlgorithmService,
            locale,
            pickChallengeService,
            certificationCandidateRepository,
            complementaryCertificationRepository,
          });

          // then
          expect(challenge).to.equal(nextChallengeToAnswer);
        });
      });

      context('when resuming the session', function () {
        it('should return the last seen challenge', async function () {
          // given
          const locale = 'fr-FR';

          const v3CertificationCourse = domainBuilder.buildCertificationCourse({
            version: AlgorithmEngineVersion.V3,
          });
          const assessment = domainBuilder.buildAssessment();

          const nonAnsweredCertificationChallenge = domainBuilder.buildCertificationChallenge({
            courseId: v3CertificationCourse.getId(),
          });

          const lastSeenChallenge = domainBuilder.buildChallenge({
            id: nonAnsweredCertificationChallenge.challengeId,
          });

          answerRepository.findByAssessmentExcludingChallengeIds
            .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
            .resolves([]);
          certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
            .withArgs({ assessmentId: assessment.id })
            .resolves([]);

          certificationCourseRepository.get
            .withArgs({ id: assessment.certificationCourseId })
            .resolves(v3CertificationCourse);
          sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
            .withArgs(assessment.certificationCourseId, [])
            .resolves(nonAnsweredCertificationChallenge);
          sharedChallengeRepository.get
            .withArgs(nonAnsweredCertificationChallenge.challengeId)
            .resolves(lastSeenChallenge);

          // when
          const challenge = await getNextChallenge({
            answerRepository,
            assessment,
            sessionManagementCertificationChallengeRepository,
            certificationChallengeLiveAlertRepository,
            certificationCourseRepository,
            sharedChallengeRepository,
            versionRepository,
            flashAlgorithmService,
            locale,
            pickChallengeService,
            certificationCandidateRepository,
            complementaryCertificationRepository,
          });

          // then
          expect(challenge).to.equal(lastSeenChallenge);
          expect(sessionManagementCertificationChallengeRepository.save).not.to.have.been.called;
        });
      });
    });

    context('when some answered challenges are not valid anymore', function () {
      it('saves next challenge', async function () {
        // given
        const nextChallengeToAnswer = domainBuilder.buildChallenge({
          id: 'nextChallengeToAnswer',
          blindnessCompatibility: 'KO',
          status: 'validé',
          skill: domainBuilder.buildSkill({ id: 'nottAnsweredSkill' }),
        });
        const alreadyAnsweredChallenge = domainBuilder.buildChallenge({
          id: 'alreadyAnsweredChallenge',
          status: 'validé',
        });
        const outdatedChallenge = domainBuilder.buildChallenge({ id: 'outdatedChallenge', status: 'périmé' });
        const v3CertificationCourse = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
        });
        const locale = 'fr-FR';

        versionRepository.getByScopeAndReconciliationDate.resolves(version);

        const answerStillValid = domainBuilder.buildAnswer({ challengeId: alreadyAnsweredChallenge.id });
        const answerWithOutdatedChallenge = domainBuilder.buildAnswer({ challengeId: outdatedChallenge.id });
        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
          .resolves([answerStillValid, answerWithOutdatedChallenge]);

        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourse);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [])
          .resolves(null);
        sharedChallengeRepository.get.resolves();

        const candidate = domainBuilder.certification.evaluation.buildCandidate();
        certificationCandidateRepository.findByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves(candidate);

        sharedChallengeRepository.findActiveFlashCompatible
          .withArgs({
            locale,
            complementaryCertificationKey: undefined,
            version,
          })
          .resolves([alreadyAnsweredChallenge, nextChallengeToAnswer]);

        sharedChallengeRepository.getMany
          .withArgs([alreadyAnsweredChallenge.id, outdatedChallenge.id])
          .resolves([alreadyAnsweredChallenge, outdatedChallenge]);

        flashAlgorithmService.getCapacityAndErrorRate
          .withArgs({
            allAnswers: [answerStillValid, answerWithOutdatedChallenge],
            challenges: [alreadyAnsweredChallenge, outdatedChallenge, nextChallengeToAnswer],
            capacity: config.v3Certification.defaultCandidateCapacity,
            variationPercent: undefined,
          })
          .returns({ capacity: 0 });

        flashAlgorithmService.getPossibleNextChallenges
          .withArgs({
            availableChallenges: [nextChallengeToAnswer],
            capacity: 0,
          })
          .returns([nextChallengeToAnswer]);

        const getChallengePickerImpl = sinon.stub();
        getChallengePickerImpl
          .withArgs({
            possibleChallenges: [nextChallengeToAnswer],
          })
          .returns(nextChallengeToAnswer);
        pickChallengeService.getChallengePicker.withArgs().returns(getChallengePickerImpl);

        // when
        const challenge = await getNextChallenge({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          versionRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          complementaryCertificationRepository,
        });

        // then
        expect(challenge).to.equal(nextChallengeToAnswer);
      });
    });

    context('when there are challenges with validated live alerts', function () {
      it('should save the returned next challenge', async function () {
        // given
        const locale = 'fr-FR';
        const skill = domainBuilder.buildSkill({ id: 'skill1' });

        const v3CertificationCourse = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
        });
        const assessment = domainBuilder.buildAssessment();

        const nonAnsweredCertificationChallenge = domainBuilder.buildCertificationChallenge({
          courseId: v3CertificationCourse.getId(),
        });

        const nextChallenge = domainBuilder.buildChallenge({
          id: 'NextChallenge',
          skill,
        });

        const lastSeenChallenge = domainBuilder.buildChallenge({
          id: nonAnsweredCertificationChallenge.challengeId,
        });

        versionRepository.getByScopeAndReconciliationDate.resolves(version);

        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({
            assessmentId: assessment.id,
            excludedChallengeIds: [nonAnsweredCertificationChallenge.challengeId],
          })
          .resolves([]);

        const candidate = domainBuilder.certification.evaluation.buildCandidate();
        certificationCandidateRepository.findByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves(candidate);

        sharedChallengeRepository.findActiveFlashCompatible
          .withArgs({
            locale,
            complementaryCertificationKey: undefined,
            version,
          })
          .resolves([nextChallenge, lastSeenChallenge]);
        sharedChallengeRepository.getMany.withArgs([]).resolves([]);

        flashAlgorithmService.getCapacityAndErrorRate
          .withArgs({
            allAnswers: [],
            challenges: [nextChallenge],
            capacity: config.v3Certification.defaultCandidateCapacity,
            variationPercent: undefined,
          })
          .returns({ capacity: 0 });

        flashAlgorithmService.getPossibleNextChallenges
          .withArgs({
            availableChallenges: [nextChallenge],
            capacity: 0,
          })
          .returns([nextChallenge]);

        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([nonAnsweredCertificationChallenge.challengeId]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourse);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [])
          .resolves(nonAnsweredCertificationChallenge);

        const getChallengePickerImpl = sinon.stub();
        getChallengePickerImpl
          .withArgs({
            possibleChallenges: [nextChallenge],
          })
          .returns(nextChallenge);
        pickChallengeService.getChallengePicker.withArgs().returns(getChallengePickerImpl);

        // when
        const challenge = await getNextChallenge({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          versionRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          complementaryCertificationRepository,
        });

        // then
        expect(challenge).to.equal(nextChallenge);
        expect(sessionManagementCertificationChallengeRepository.save).to.have.been.called;
      });

      it('should not return a challenge with the same skill', async function () {
        // given
        const locale = 'fr-FR';
        const firstSkill = domainBuilder.buildSkill({ id: 'skill1' });
        const secondSkill = domainBuilder.buildSkill({ id: 'skill2' });

        const v3CertificationCourse = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
        });
        const assessment = domainBuilder.buildAssessment();

        const nonAnsweredCertificationChallenge = domainBuilder.buildCertificationChallenge({
          courseId: v3CertificationCourse.getId(),
        });

        const challengeWithLiveAlertedSkill = domainBuilder.buildChallenge({
          id: 'NextChallenge',
          skill: firstSkill,
        });

        const challengeWithOtherSkill = domainBuilder.buildChallenge({
          id: 'NextChallenge',
          skill: secondSkill,
        });

        const challengeWithLiveAlert = domainBuilder.buildChallenge({
          id: nonAnsweredCertificationChallenge.challengeId,
          skill: firstSkill,
        });

        versionRepository.getByScopeAndReconciliationDate.resolves(version);

        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({
            assessmentId: assessment.id,
            excludedChallengeIds: [nonAnsweredCertificationChallenge.challengeId],
          })
          .resolves([]);
        sharedChallengeRepository.findActiveFlashCompatible
          .withArgs()
          .resolves([challengeWithLiveAlert, challengeWithOtherSkill, challengeWithLiveAlertedSkill]);
        sharedChallengeRepository.getMany.withArgs([]).resolves([]);

        flashAlgorithmService.getCapacityAndErrorRate
          .withArgs({
            allAnswers: [],
            challenges: [challengeWithOtherSkill],
            capacity: config.v3Certification.defaultCandidateCapacity,
            variationPercent: undefined,
          })
          .returns({ capacity: 0 });

        flashAlgorithmService.getPossibleNextChallenges
          .withArgs({
            availableChallenges: [challengeWithOtherSkill],
            capacity: 0,
          })
          .returns([challengeWithOtherSkill]);

        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([nonAnsweredCertificationChallenge.challengeId]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourse);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [])
          .resolves(nonAnsweredCertificationChallenge);

        const getChallengePickerImpl = sinon.stub();
        getChallengePickerImpl
          .withArgs({
            possibleChallenges: [challengeWithOtherSkill],
          })
          .returns(challengeWithOtherSkill);
        pickChallengeService.getChallengePicker.withArgs().returns(getChallengePickerImpl);

        // when
        const challenge = await getNextChallenge({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          versionRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          complementaryCertificationRepository,
        });

        // then
        expect(challenge).to.equal(challengeWithOtherSkill);
        expect(sessionManagementCertificationChallengeRepository.save).to.have.been.called;
      });
    });

    context('when there are no challenges left', function () {
      it('should return the AssessmentEndedError', async function () {
        // given
        const answeredChallenge = domainBuilder.buildChallenge();
        const answer = domainBuilder.buildAnswer({ challengeId: answeredChallenge.id });
        const v3CertificationCourse = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
        });
        const assessment = domainBuilder.buildAssessment();
        const locale = 'fr-FR';

        const flashAlgorithmService = {
          getPossibleNextChallenges: sinon.stub(),
          getCapacityAndErrorRate: sinon.stub(),
        };

        const challengesConfiguration = domainBuilder.buildFlashAlgorithmConfiguration({ maximumAssessmentLength: 1 });
        version = domainBuilder.certification.evaluation.buildEvaluationVersion({ challengesConfiguration });
        versionRepository.getByScopeAndReconciliationDate.resolves(version);

        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
          .resolves([answer]);
        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourse);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [answeredChallenge.id])
          .resolves(null);
        sharedChallengeRepository.get.resolves();

        const candidate = domainBuilder.certification.evaluation.buildCandidate();
        certificationCandidateRepository.findByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves(candidate);

        sharedChallengeRepository.findActiveFlashCompatible
          .withArgs({
            locale,
            complementaryCertificationKey: undefined,
            version,
          })
          .resolves([answeredChallenge]);
        sharedChallengeRepository.getMany.withArgs([answeredChallenge.id]).resolves([answeredChallenge]);

        // when
        const error = await catchErr(getNextChallenge)({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          versionRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          complementaryCertificationRepository,
          certificationCandidateId,
        });

        // then
        expect(error).to.be.instanceOf(AssessmentEndedError);
        expect(error.message).to.equal('Evaluation terminée.');
      });
    });

    context('when loading a configuration', function () {
      const competenceId = 'cmp1';

      Object.entries({
        challengesBetweenSameCompetence: 2,
        limitToOneQuestionPerTube: true,
        enablePassageByAllCompetences: true,
        variationPercent: 20,
      })
        .map(([key, value]) => ({
          [key]: value,
        }))
        .forEach((flashConfiguration) => {
          it('should use the configuration', async function () {
            //given
            const nextChallengeToAnswer = domainBuilder.buildChallenge({
              competenceId,
            });

            const v3CertificationCourse = domainBuilder.buildCertificationCourse({
              version: AlgorithmEngineVersion.V3,
            });

            const challengesConfiguration = domainBuilder.buildFlashAlgorithmConfiguration(flashConfiguration);
            version = domainBuilder.certification.evaluation.buildEvaluationVersion({ challengesConfiguration });
            versionRepository.getByScopeAndReconciliationDate.resolves(version);

            const assessment = domainBuilder.buildAssessment();
            const locale = 'fr-FR';

            answerRepository.findByAssessmentExcludingChallengeIds
              .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
              .resolves([]);
            certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
              .withArgs({ assessmentId: assessment.id })
              .resolves([]);

            certificationCourseRepository.get
              .withArgs({ id: assessment.certificationCourseId })
              .resolves(v3CertificationCourse);
            sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
              .withArgs(assessment.certificationCourseId, [])
              .resolves(null);
            sharedChallengeRepository.get.resolves();

            const candidate = domainBuilder.certification.evaluation.buildCandidate();
            certificationCandidateRepository.findByAssessmentId
              .withArgs({ assessmentId: assessment.id })
              .resolves(candidate);

            sharedChallengeRepository.findActiveFlashCompatible
              .withArgs({
                locale,
                complementaryCertificationKey: undefined,
                version,
              })
              .resolves([nextChallengeToAnswer]);
            sharedChallengeRepository.getMany.withArgs([]).resolves([]);

            flashAlgorithmService.getCapacityAndErrorRate
              .withArgs({
                allAnswers: [],
                challenges: [nextChallengeToAnswer],
                capacity: config.v3Certification.defaultCandidateCapacity,
                variationPercent: version.challengesConfiguration.variationPercent,
              })
              .returns({ capacity: 0 });

            flashAlgorithmService.getPossibleNextChallenges
              .withArgs({
                availableChallenges: [nextChallengeToAnswer],
                capacity: 0,
              })
              .returns([nextChallengeToAnswer]);

            const getChallengePickerImpl = sinon.stub();
            getChallengePickerImpl
              .withArgs({
                possibleChallenges: [nextChallengeToAnswer],
              })
              .returns(nextChallengeToAnswer);
            pickChallengeService.getChallengePicker.withArgs().returns(getChallengePickerImpl);

            // when
            const challenge = await getNextChallenge({
              answerRepository,
              assessment,
              sessionManagementCertificationChallengeRepository,
              certificationChallengeLiveAlertRepository,
              certificationCourseRepository,
              sharedChallengeRepository,
              versionRepository,
              flashAlgorithmService,
              locale,
              pickChallengeService,
              certificationCandidateRepository,
              complementaryCertificationRepository,
            });

            // then
            expect(challenge).to.equal(nextChallengeToAnswer);
          });
        });
    });

    context('when the certification is a complementary certification', function () {
      it('should call findActiveFlashCompatible with the version', async function () {
        // given
        versionRepository = {
          getByScopeAndReconciliationDate: sinon.stub(),
        };
        const v3CertificationCourse = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
        });
        const assessment = domainBuilder.buildAssessment({
          certificationCourseId: v3CertificationCourse.getId(),
        });
        const locale = 'fr-FR';

        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
          .resolves([]);
        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourse);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [])
          .resolves(null);
        sharedChallengeRepository.get.resolves();

        const candidate = domainBuilder.certification.evaluation.buildCandidate({
          subscriptionScope: Frameworks.PIX_PLUS_EDU_CPE,
        });
        certificationCandidateRepository.findByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves(candidate);

        version = domainBuilder.certification.evaluation.buildEvaluationVersion({ scope: Frameworks.PIX_PLUS_EDU_CPE });
        versionRepository.getByScopeAndReconciliationDate
          .withArgs({
            scope: Frameworks.PIX_PLUS_EDU_CPE,
            reconciliationDate: candidate.reconciledAt,
          })
          .resolves(version);

        sharedChallengeRepository.findActiveFlashCompatible.resolves([]);

        // when
        await catchErr(getNextChallenge)({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          versionRepository,
          complementaryCertificationRepository,
          certificationCandidateId,
        });

        // then
        expect(sharedChallengeRepository.findActiveFlashCompatible).to.have.been.calledOnceWithExactly({
          locale,
          complementaryCertificationKey: Frameworks.PIX_PLUS_EDU_CPE,
          version,
        });
      });
    });

    context('when the certification is a Pix core or double certification', function () {
      it('should call findActiveFlashCompatible without version', async function () {
        // given
        const v3CertificationCourse = domainBuilder.buildCertificationCourse({
          version: AlgorithmEngineVersion.V3,
        });
        const assessment = domainBuilder.buildAssessment({
          certificationCourseId: v3CertificationCourse.getId(),
        });
        const locale = 'fr-FR';

        answerRepository.findByAssessmentExcludingChallengeIds
          .withArgs({ assessmentId: assessment.id, excludedChallengeIds: [] })
          .resolves([]);
        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves([]);

        certificationCourseRepository.get
          .withArgs({ id: assessment.certificationCourseId })
          .resolves(v3CertificationCourse);
        sessionManagementCertificationChallengeRepository.getNextChallengeByCourseId
          .withArgs(assessment.certificationCourseId, [])
          .resolves(null);
        versionRepository.getByScopeAndReconciliationDate.resolves(version);
        sharedChallengeRepository.get.resolves();

        const candidate = domainBuilder.certification.evaluation.buildCandidate({
          subscriptionScope: Frameworks.CORE,
        });
        certificationCandidateRepository.findByAssessmentId
          .withArgs({ assessmentId: assessment.id })
          .resolves(candidate);

        sharedChallengeRepository.findActiveFlashCompatible.resolves([]);

        // when
        await catchErr(getNextChallenge)({
          answerRepository,
          assessment,
          sessionManagementCertificationChallengeRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          sharedChallengeRepository,
          flashAlgorithmService,
          locale,
          pickChallengeService,
          certificationCandidateRepository,
          complementaryCertificationRepository,
          versionRepository,
          certificationCandidateId,
        });

        // then
        expect(sharedChallengeRepository.findActiveFlashCompatible).to.have.been.calledOnceWithExactly({
          locale,
          complementaryCertificationKey: undefined,
          version,
        });
      });
    });
  });
});
