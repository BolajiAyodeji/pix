import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import { CombinedCourseParticipation } from '../../../../../src/quest/domain/models/CombinedCourseParticipation.js';
import { usecases } from '../../../../../src/quest/domain/usecases/index.js';
import { databaseBuilder, expect } from '../../../../test-helper.js';

describe('Quest | Integration | Domain | Usecases | findCombinedCourseParticipations', function () {
  it('should return  CombinedCourseParticipations', async function () {
    // given
    const {
      questId,
      organizationId,
      id: combinedCourseId,
    } = databaseBuilder.factory.buildCombinedCourse({ code: 'COMBI1' });
    const learner = databaseBuilder.factory.buildOrganizationLearner({
      firstName: 'Paul',
      lastName: 'Azerty',
      organizationId,
    });
    const participation1 = databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner.id,
      questId,
      combinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });
    const { questId: anotherquestId, id: anotherCombinedCourseId } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COMBI2',
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner.id,
      questId: anotherquestId,
      combinedCourseId: anotherCombinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });

    await databaseBuilder.commit();

    // when
    const { combinedCourseParticipations } = await usecases.findCombinedCourseParticipations({ combinedCourseId });

    // then
    expect(combinedCourseParticipations).lengthOf(1);
    expect(combinedCourseParticipations[0]).instanceOf(CombinedCourseParticipation);
    expect(combinedCourseParticipations).deep.equal([
      {
        id: participation1.id,
        firstName: learner.firstName,
        lastName: learner.lastName,
        status: CombinedCourseParticipationStatuses.COMPLETED,
        createdAt: participation1.createdAt,
        updatedAt: participation1.updatedAt,
        organizationLearnerId: learner.id,
        organizationLearnerParticipationId: null,
        questId,
      },
    ]);
  });
  it('should return a paginated list of combinedCourseParticipation', async function () {
    // given
    const {
      questId,
      organizationId,
      id: combinedCourseId,
    } = databaseBuilder.factory.buildCombinedCourse({ code: 'COMBI1' });
    const learner = databaseBuilder.factory.buildOrganizationLearner({
      firstName: 'Paul',
      lastName: 'Azerty',
      organizationId,
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner.id,
      questId,
      combinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });
    const anotherLearner = databaseBuilder.factory.buildOrganizationLearner({
      firstName: 'Marianne',
      lastName: 'Klee',
      organizationId,
    });
    const anotherParticipation = databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: anotherLearner.id,
      questId,
      combinedCourseId,
      status: CombinedCourseParticipationStatuses.STARTED,
    });
    const { questId: anotherquestId, id: anotherCombinedCourseId } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COMBI2',
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner.id,
      questId: anotherquestId,
      combinedCourseId: anotherCombinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });

    await databaseBuilder.commit();

    // when
    const { combinedCourseParticipations, meta } = await usecases.findCombinedCourseParticipations({
      combinedCourseId,
      page: { size: 1, number: 2 },
    });

    // then
    expect(meta).deep.equal({ page: 2, pageSize: 1, rowCount: 2, pageCount: 2 });
    expect(combinedCourseParticipations).lengthOf(1);
    expect(combinedCourseParticipations[0]).instanceOf(CombinedCourseParticipation);
    expect(combinedCourseParticipations).deep.equal([
      {
        id: anotherParticipation.id,
        firstName: anotherLearner.firstName,
        lastName: anotherLearner.lastName,
        status: CombinedCourseParticipationStatuses.STARTED,
        organizationLearnerParticipationId: null,
        createdAt: anotherParticipation.createdAt,
        updatedAt: anotherParticipation.updatedAt,
        organizationLearnerId: anotherLearner.id,
        questId,
      },
    ]);
  });
});
