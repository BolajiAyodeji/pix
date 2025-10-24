import { createReadStream } from 'node:fs';

import { getDataBuffer } from '../../prescription/learner-management/infrastructure/utils/bufferize/get-data-buffer.js';
import { extractUserIdFromRequest } from '../../shared/infrastructure/utils/request-response-utils.js';
import { usecases } from '../domain/usecases/index.js';
import * as combinedCourseDetailsSerializer from '../infrastructure/serializers/combined-course-details-serializer.js';
import * as combinedCourseListSerializer from '../infrastructure/serializers/combined-course-list-serializer.js';
import * as combinedCourseParticipationSerializer from '../infrastructure/serializers/combined-course-participation-serializer.js';
import * as combinedCourseSerializer from '../infrastructure/serializers/combined-course-serializer.js';
import * as combinedCourseStatisticsSerializer from '../infrastructure/serializers/combined-course-statistics-serializer.js';

const getByCode = async function (request, _, dependencies = { combinedCourseSerializer }) {
  const { code } = request.query.filter;

  const { userId } = request.auth.credentials;

  const combinedCourse = await usecases.getCombinedCourseByCode({ userId, code });
  return dependencies.combinedCourseSerializer.serialize(combinedCourse);
};

const getById = async (request, _, dependencies = { combinedCourseDetailsSerializer }) => {
  const combinedCourseId = request.params.combinedCourseId;
  const combinedCourseDetails = await usecases.getCombinedCourseById({ combinedCourseId });

  return dependencies.combinedCourseDetailsSerializer.serialize(combinedCourseDetails);
};

const getByOrganizationId = async (request, _, dependencies = { combinedCourseListSerializer }) => {
  const organizationId = request.params.organizationId;
  const combinedCourses = await usecases.getCombinedCoursesByOrganizationId({ organizationId });

  return dependencies.combinedCourseListSerializer.serialize(combinedCourses);
};

const getStatistics = async (request, _, dependencies = { combinedCourseStatisticsSerializer }) => {
  const combinedCourseId = request.params.combinedCourseId;
  const combinedCourseStatistics = await usecases.getCombinedCourseStatistics({ combinedCourseId });
  return dependencies.combinedCourseStatisticsSerializer.serialize(combinedCourseStatistics);
};

const findParticipations = async (request, _, dependencies = { combinedCourseParticipationSerializer }) => {
  const combinedCourseId = request.params.combinedCourseId;
  const page = request.query.page;
  const filters = request.query.filters;
  const { combinedCourseParticipations, meta } = await usecases.findCombinedCourseParticipations({
    combinedCourseId,
    page,
    filters,
  });
  return dependencies.combinedCourseParticipationSerializer.serialize(combinedCourseParticipations, meta);
};

const start = async function (request, h) {
  const userId = extractUserIdFromRequest(request);
  const code = request.params.code;

  await usecases.startCombinedCourse({
    userId,
    code,
  });

  return h.response().code(204);
};

const reassessStatus = async function (request, h) {
  const userId = extractUserIdFromRequest(request);
  const code = request.params.code;

  await usecases.updateCombinedCourse({
    userId,
    code,
  });

  return h.response().code(204);
};

const createCombinedCourses = async function (request, h) {
  const filePath = request.payload.path;
  const stream = createReadStream(filePath);
  const payload = await getDataBuffer(stream);
  await usecases.createCombinedCourses({ payload });
  return h.response(null).code(204);
};

const combinedCourseController = {
  getByCode,
  getById,
  getByOrganizationId,
  getStatistics,
  findParticipations,
  start,
  reassessStatus,
  createCombinedCourses,
};

export { combinedCourseController };
