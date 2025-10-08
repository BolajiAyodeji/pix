import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import { CombinedCourseStatistics } from '../../../../../src/quest/domain/models/CombinedCourseStatistics.js';
import { usecases } from '../../../../../src/quest/domain/usecases/index.js';
import { databaseBuilder, expect } from '../../../../test-helper.js';

describe('Quest | Integration | Domain | Usecases | getCombinedCourseStatistics', function () {
  it('should return adequate combined course participations statistics', async function () {
    // given :
    const organizationId = databaseBuilder.factory.buildOrganization().id;
    const learner = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'Paul',
      lastName: 'Azerty',
    });
    const learner2 = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'John',
      lastName: 'Qwerty',
    });
    const { id: combinedCourseId, questId } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COMBI1',
      organizationId,
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner.id,
      questId,
      combinedCourseId,
      status: CombinedCourseParticipationStatuses.COMPLETED,
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      organizationLearnerId: learner2.id,
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
    const result = await usecases.getCombinedCourseStatistics({ combinedCourseId });

    // then
    expect(result).instanceOf(CombinedCourseStatistics);
    expect(result).deep.equal({
      id: combinedCourseId,
      participationsCount: 2,
      completedParticipationsCount: 1,
    });
  });
});
