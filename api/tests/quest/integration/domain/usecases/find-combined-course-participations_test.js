import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import { CombinedCourseParticipationDetails } from '../../../../../src/quest/domain/models/CombinedCourseParticipationDetails.js';
import { usecases } from '../../../../../src/quest/domain/usecases/index.js';
import { databaseBuilder, expect } from '../../../../test-helper.js';

describe('Quest | Integration | Domain | Usecases | findCombinedCourseParticipations', function () {
  let combinedCourseId, participation1, participation2, learner1, learner2;

  beforeEach(async function () {
    const { id: campaignId, organizationId } = databaseBuilder.factory.buildCampaign();
    const combinedCourse = databaseBuilder.factory.buildCombinedCourse({
      code: 'COMBI1',
      organizationId,
      successRequirements: [
        {
          requirement_type: 'campaignParticipations',
          comparison: 'all',
          data: {
            campaignId: {
              data: campaignId,
              comparison: 'equal',
            },
            status: {
              data: 'SHARED',
              comparison: 'equal',
            },
          },
        },
        {
          requirement_type: 'passages',
          comparison: 'all',
          data: {
            moduleId: {
              data: 'eeeb4951-6f38-4467-a4ba-0c85ed71321a',
              comparison: 'equal',
            },
            isTerminated: {
              data: true,
              comparison: 'equal',
            },
          },
        },
      ],
    });
    combinedCourseId = combinedCourse.id;

    learner1 = databaseBuilder.factory.buildOrganizationLearner({
      firstName: 'Paul',
      lastName: 'Azerty',
      organizationId,
    });
    participation1 = databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner1.id,
      questId: combinedCourse.questId,
      combinedCourseId,
      status: CombinedCourseParticipationStatuses.STARTED,
    });
    learner2 = databaseBuilder.factory.buildOrganizationLearner({
      firstName: 'Marianne',
      lastName: 'Klee',
      organizationId,
    });
    participation2 = databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner2.id,
      questId: combinedCourse.questId,
      combinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });
    databaseBuilder.factory.buildCampaignParticipation({
      campaignId,
      organizationLearnerId: learner2.id,
      userId: learner2.userId,
    });
    databaseBuilder.factory.buildPassage({
      moduleId: 'eeeb4951-6f38-4467-a4ba-0c85ed71321a',
      userId: learner2.userId,
      terminatedAt: new Date('2025-10-12'),
    });

    const { questId: anotherQuestId, id: anotherCombinedCourseId } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COMBI2',
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner1.id,
      questId: anotherQuestId,
      combinedCourseId: anotherCombinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });

    await databaseBuilder.commit();
  });

  it('should return participations with details from a combined course', async function () {
    // when
    const { combinedCourseParticipations } = await usecases.findCombinedCourseParticipations({
      combinedCourseId,
    });

    // then
    expect(combinedCourseParticipations).lengthOf(2);
    expect(combinedCourseParticipations[0]).instanceOf(CombinedCourseParticipationDetails);
    expect(combinedCourseParticipations).deep.equal([
      {
        id: participation1.id,
        firstName: learner1.firstName,
        lastName: learner1.lastName,
        status: CombinedCourseParticipationStatuses.STARTED,
        createdAt: participation1.createdAt,
        updatedAt: participation1.updatedAt,
        hasFormationItem: false,
        nbModules: 1,
        nbModulesCompleted: 0,
        nbCampaigns: 1,
        nbCampaignsCompleted: 0,
      },
      {
        id: participation2.id,
        firstName: learner2.firstName,
        lastName: learner2.lastName,
        status: CombinedCourseParticipationStatuses.COMPLETED,
        createdAt: participation2.createdAt,
        updatedAt: participation2.updatedAt,
        hasFormationItem: false,
        nbModules: 1,
        nbModulesCompleted: 1,
        nbCampaigns: 1,
        nbCampaignsCompleted: 1,
      },
    ]);
  });

  it('should return a paginated list of participations with details', async function () {
    // when
    const { combinedCourseParticipations, meta } = await usecases.findCombinedCourseParticipations({
      combinedCourseId,
      page: { size: 1, number: 2 },
    });

    // then
    expect(meta).deep.equal({ page: 2, pageSize: 1, rowCount: 2, pageCount: 2 });
    expect(combinedCourseParticipations).lengthOf(1);
    expect(combinedCourseParticipations[0]).instanceOf(CombinedCourseParticipationDetails);
    expect(combinedCourseParticipations).deep.equal([
      {
        id: participation2.id,
        firstName: learner2.firstName,
        lastName: learner2.lastName,
        status: CombinedCourseParticipationStatuses.COMPLETED,
        createdAt: participation2.createdAt,
        updatedAt: participation2.updatedAt,
        hasFormationItem: false,
        nbModules: 1,
        nbModulesCompleted: 1,
        nbCampaigns: 1,
        nbCampaignsCompleted: 1,
      },
    ]);
  });
});
