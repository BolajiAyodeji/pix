import { PromiseUtils } from '../../../shared/infrastructure/utils/promise-utils.js';

export const findCombinedCourseParticipations = async ({
  combinedCourseId,
  page,
  filters,
  combinedCourseParticipationRepository,
  combinedCourseDetailsService,
}) => {
  const { userIds, meta } = await combinedCourseParticipationRepository.findUserIdsById({
    combinedCourseId,
    page,
    filters,
  });

  const combinedCourseParticipations = await PromiseUtils.mapSeries(userIds, async (userId) => {
    const combinedCourseDetails = await combinedCourseDetailsService.getCombinedCourseDetails({
      userId,
      combinedCourseId,
    });
    return combinedCourseDetails.participationDetails;
  });

  return {
    combinedCourseParticipations,
    meta,
  };
};
