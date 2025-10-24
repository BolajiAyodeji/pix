import { combinedCourseController } from '../../../../src/quest/application/combined-course-controller.js';
import { usecases } from '../../../../src/quest/domain/usecases/index.js';
import { expect, sinon } from '../../../test-helper.js';

describe('Unit | Quest | Application | Controller | CombinedCourse', function () {
  describe('#getById', function () {
    it('should call getCombinedCourseByQuestId usecase with questId', async function () {
      // given
      const combinedCourseId = 'combinedCourseId123';
      const combinedCourse = Symbol('combinedCourse');
      const serializedCombinedCourse = Symbol('serializedCombinedCourse');
      const request = {
        params: { combinedCourseId },
      };

      sinon.stub(usecases, 'getCombinedCourseById').resolves(combinedCourse);
      const combinedCourseDetailsSerializer = { serialize: sinon.stub() };
      combinedCourseDetailsSerializer.serialize.withArgs(combinedCourse).returns(serializedCombinedCourse);

      // when
      const result = await combinedCourseController.getById(request, null, { combinedCourseDetailsSerializer });

      // then
      expect(usecases.getCombinedCourseById).to.have.been.calledOnceWithExactly({ combinedCourseId });
      expect(combinedCourseDetailsSerializer.serialize).to.have.been.calledOnceWithExactly(combinedCourse);
      expect(result).to.equal(serializedCombinedCourse);
    });
  });
  describe('#findParticipations', function () {
    it('should call findCombinedCourseParticipation usecase with questId', async function () {
      // given
      const combinedCourseId = 'combinedCourseId123';
      const combinedCourseParticipations = Symbol('combinedCourseParticipations');
      const serializedCombinedCourseParticipations = Symbol('serializedCombinedCourseParticipations');
      const page = Symbol('page');
      const meta = Symbol('meta');
      const filters = Symbol('filters');
      const request = {
        params: { combinedCourseId },
        query: { page, filters },
      };

      sinon
        .stub(usecases, 'findCombinedCourseParticipations')
        .withArgs({ combinedCourseId, page, filters })
        .resolves({ combinedCourseParticipations, meta });
      const combinedCourseParticipationSerializer = { serialize: sinon.stub() };
      combinedCourseParticipationSerializer.serialize
        .withArgs(combinedCourseParticipations, meta)
        .returns(serializedCombinedCourseParticipations);

      // when
      const result = await combinedCourseController.findParticipations(request, null, {
        combinedCourseParticipationSerializer,
      });

      // then
      expect(result).to.equal(serializedCombinedCourseParticipations);
    });
  });
  describe('#getStatistics', function () {
    it('should call getCombinedCourseStatistics usecase with questId', async function () {
      // given
      const combinedCourseId = 'combinedCourseId123';
      const combinedCourseStatistics = Symbol('combinedCourseStatistics');
      const serializedCombinedCourseStatistics = Symbol('serializedCombinedCourseStatistics');
      const request = {
        params: { combinedCourseId },
      };

      sinon
        .stub(usecases, 'getCombinedCourseStatistics')
        .withArgs({ combinedCourseId })
        .resolves(combinedCourseStatistics);
      const combinedCourseStatisticsSerializer = { serialize: sinon.stub() };
      combinedCourseStatisticsSerializer.serialize
        .withArgs(combinedCourseStatistics)
        .returns(serializedCombinedCourseStatistics);

      // when
      const result = await combinedCourseController.getStatistics(request, null, {
        combinedCourseStatisticsSerializer: combinedCourseStatisticsSerializer,
      });

      // then
      expect(result).to.equal(serializedCombinedCourseStatistics);
    });
  });
});
