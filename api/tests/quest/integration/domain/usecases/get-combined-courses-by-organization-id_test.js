import { CombinedCourse } from '../../../../../src/quest/domain/models/CombinedCourse.js';
import { CombinedCourseParticipation } from '../../../../../src/quest/domain/models/CombinedCourseParticipation.js';
import { usecases } from '../../../../../src/quest/domain/usecases/index.js';
import { databaseBuilder, expect } from '../../../../test-helper.js';

describe('Integration | Quest | Domain | UseCases | get-combined-courses-by-organization-id', function () {
  it('should return combined courses for an organization with their participations', async function () {
    // given
    const { id: organizationId } = databaseBuilder.factory.buildOrganization();
    const { id: combinedCourseId1, questId: quest1 } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COURSE1',
      name: 'First Combined Course',
      organizationId,
    });
    const { id: combinedCourseId2, questId: quest2 } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COURSE2',
      name: 'Second Combined Course',
      organizationId,
    });

    const { id: organizationLearnerId1 } = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'Alice',
      lastName: 'Anderson',
    });
    const { id: organizationLearnerId2 } = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'Bob',
      lastName: 'Brown',
    });
    const { id: organizationLearnerId3 } = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'Charlie',
      lastName: 'Clark',
    });

    databaseBuilder.factory.buildCombinedCourseParticipation({
      questId: quest1,
      organizationLearnerId: organizationLearnerId1,
      combinedCourseId: combinedCourseId1,
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      questId: quest1,
      combinedCourseId: combinedCourseId1,
      organizationLearnerId: organizationLearnerId2,
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      questId: quest2,
      combinedCourseId: combinedCourseId2,
      organizationLearnerId: organizationLearnerId3,
    });

    await databaseBuilder.commit();

    // when
    const result = await usecases.getCombinedCoursesByOrganizationId({ organizationId });

    // then
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.be.an.instanceof(CombinedCourse);
    expect(result[1]).to.be.an.instanceof(CombinedCourse);

    const firstCourse = result.find((course) => course.id === combinedCourseId1);
    const secondCourse = result.find((course) => course.id === combinedCourseId2);

    expect(firstCourse.code).to.equal('COURSE1');
    expect(firstCourse.name).to.equal('First Combined Course');
    expect(firstCourse.participations).to.have.lengthOf(2);
    expect(firstCourse.participations[0]).to.be.an.instanceof(CombinedCourseParticipation);
    expect(firstCourse.participations[0].firstName).to.equal('Alice');
    expect(firstCourse.participations[0].lastName).to.equal('Anderson');
    expect(firstCourse.participations[1].firstName).to.equal('Bob');
    expect(firstCourse.participations[1].lastName).to.equal('Brown');

    expect(secondCourse.code).to.equal('COURSE2');
    expect(secondCourse.name).to.equal('Second Combined Course');
    expect(secondCourse.participations).to.have.lengthOf(1);
    expect(secondCourse.participations[0]).to.be.an.instanceof(CombinedCourseParticipation);
    expect(secondCourse.participations[0].firstName).to.equal('Charlie');
    expect(secondCourse.participations[0].lastName).to.equal('Clark');
  });

  it('should return combined courses with empty participations when no participations exist', async function () {
    // given
    const { id: organizationId } = databaseBuilder.factory.buildOrganization();
    const { id: combinedCourseId1 } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COURSE3',
      name: 'Third Combined Course',
      organizationId,
    });

    await databaseBuilder.commit();

    // when
    const result = await usecases.getCombinedCoursesByOrganizationId({ organizationId });

    // then
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.be.an.instanceof(CombinedCourse);
    expect(result[0].id).to.equal(combinedCourseId1);
    expect(result[0].code).to.equal('COURSE3');
    expect(result[0].participations).to.deep.equal([]);
  });

  it('should return empty array when no combined courses exist for organization', async function () {
    // given
    const { id: organizationId } = databaseBuilder.factory.buildOrganization();
    await databaseBuilder.commit();

    // when
    const result = await usecases.getCombinedCoursesByOrganizationId({ organizationId });

    // then
    expect(result).to.deep.equal([]);
  });

  it('should not return combined courses from other organizations', async function () {
    // given
    const { id: organizationId1 } = databaseBuilder.factory.buildOrganization();
    const { id: organizationId2 } = databaseBuilder.factory.buildOrganization();

    databaseBuilder.factory.buildCombinedCourse({
      code: 'ORG1COURSE',
      organizationId: organizationId1,
    });
    databaseBuilder.factory.buildCombinedCourse({
      code: 'ORG2COURSE',
      organizationId: organizationId2,
    });

    await databaseBuilder.commit();

    // when
    const result = await usecases.getCombinedCoursesByOrganizationId({ organizationId: organizationId1 });

    // then
    expect(result).to.have.lengthOf(1);
    expect(result[0].code).to.equal('ORG1COURSE');
  });

  it('should not include participations from other combined courses', async function () {
    // given
    const { id: organizationId } = databaseBuilder.factory.buildOrganization();
    const { id: combinedCourseId1, questId: quest1 } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COURSE1',
      organizationId,
    });
    const { id: combinedCourseId2, questId: quest2 } = databaseBuilder.factory.buildCombinedCourse({
      code: 'COURSE2',
      organizationId,
    });

    const { id: organizationLearnerId1 } = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'Alice',
      lastName: 'Anderson',
    });
    const { id: organizationLearnerId2 } = databaseBuilder.factory.buildOrganizationLearner({
      organizationId,
      firstName: 'Bob',
      lastName: 'Brown',
    });

    databaseBuilder.factory.buildCombinedCourseParticipation({
      questId: quest1,
      combinedCourseId: combinedCourseId1,
      organizationLearnerId: organizationLearnerId1,
    });
    databaseBuilder.factory.buildCombinedCourseParticipation({
      questId: quest2,
      combinedCourseId: combinedCourseId2,
      organizationLearnerId: organizationLearnerId2,
    });

    await databaseBuilder.commit();

    // when
    const result = await usecases.getCombinedCoursesByOrganizationId({ organizationId });

    // then
    const firstCourse = result.find((course) => course.id === combinedCourseId1);
    const secondCourse = result.find((course) => course.id === combinedCourseId2);

    expect(firstCourse.participations).to.have.lengthOf(1);
    expect(firstCourse.participations[0].firstName).to.equal('Alice');

    expect(secondCourse.participations).to.have.lengthOf(1);
    expect(secondCourse.participations[0].firstName).to.equal('Bob');
  });
});
