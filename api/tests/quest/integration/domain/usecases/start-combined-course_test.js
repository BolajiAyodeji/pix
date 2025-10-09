import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import { usecases } from '../../../../../src/quest/domain/usecases/index.js';
import { databaseBuilder, domainBuilder, expect, knex } from '../../../../test-helper.js';

describe('Integration | Combined course | Domain | UseCases | start-combined-course', function () {
  describe('when combined-course participation does not exist', function () {
    it('should create combined-course participation', async function () {
      //given
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId });
      const { questId, id: combinedCourseId } = databaseBuilder.factory.buildCombinedCourse({
        organizationId,
        code: 'COMBINIX8',
      });
      await databaseBuilder.commit();

      //when
      await usecases.startCombinedCourse({
        userId: organizationLearner.userId,
        code: 'COMBINIX8',
      });

      //then
      const [participation] = await knex('organization_learner_participations')
        .select(
          'questId',
          'organization_learner_participations.organizationLearnerId',
          'combined_course_participations.organizationLearnerId AS ccpOrganizationLearnerId',
          'combined_course_participations.status AS ccpStatus',
          'organization_learner_participations.status',
          'combinedCourseId',
        )
        .join(
          'combined_course_participations',
          'combined_course_participations.organizationLearnerParticipationId',
          'organization_learner_participations.id',
        )
        .where({
          questId,
          'organization_learner_participations.organizationLearnerId': organizationLearner.id,
        });

      expect(participation.questId).to.deep.equal(questId);
      expect(participation.combinedCourseId).to.equal(combinedCourseId);
      expect(participation.organizationLearnerId).to.deep.equal(organizationLearner.id);
      expect(participation.status).to.deep.equal(CombinedCourseParticipationStatuses.STARTED);

      expect(participation.ccpOrganizationLearnerId).to.equal(organizationLearner.id);
      expect(participation.ccpStatus).to.deep.equal(CombinedCourseParticipationStatuses.STARTED);
    });
    describe('when organization learner does not exist', function () {
      it('should also create organization learner', async function () {
        //given
        const user = databaseBuilder.factory.buildUser();
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        databaseBuilder.factory.buildCombinedCourse({ organizationId, code: 'COMBINIX8' });

        await databaseBuilder.commit();

        const organizationLearner = domainBuilder.buildOrganizationLearner({
          firstName: user.firstName,
          lastName: user.lastName,
        });

        //when
        await usecases.startCombinedCourse({
          userId: user.id,
          code: 'COMBINIX8',
        });

        //then
        const createdOrganizationLearner = await knex('organization-learners').where({
          firstName: organizationLearner.firstName,
          lastName: organizationLearner.lastName,
        });

        const [participation] = await knex('organization_learner_participations').where({
          organizationLearnerId: createdOrganizationLearner[0].id,
        });

        expect(createdOrganizationLearner).lengthOf(1);
        expect(participation.organizationLearnerId).to.deep.equal(createdOrganizationLearner[0].id);
      });
    });
  });
});
