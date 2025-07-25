import { usecases } from '../domain/usecases/index.js';
import * as attachableTargetProfilesSerializer from '../infrastructure/serializers/attachable-target-profiles-serializer.js';
import * as complementaryCertificationSerializer from '../infrastructure/serializers/complementary-certification-serializer.js';
import * as certificationConsolidatedFrameworkSerializer from '../infrastructure/serializers/consolidated-framework-serializer.js';

const findComplementaryCertifications = async function () {
  const complementaryCertifications = await usecases.findComplementaryCertifications();
  return complementaryCertificationSerializer.serialize(complementaryCertifications);
};

const searchAttachableTargetProfilesForComplementaryCertifications = async function (request) {
  const searchTerm = request.query.searchTerm;
  const attachableTargetProfiles = await usecases.searchAttachableTargetProfiles({ searchTerm });
  return attachableTargetProfilesSerializer.serialize(attachableTargetProfiles);
};

const createConsolidatedFramework = async function (request, h) {
  const { complementaryCertificationKey } = request.params;
  const { tubeIds } = request.payload.data.attributes;

  await usecases.createConsolidatedFramework({ complementaryCertificationKey, tubeIds });

  return h
    .response({
      data: {
        id: complementaryCertificationKey,
        type: 'certification-consolidated-framework',
      },
    })
    .code(201);
};

const calibrateConsolidatedFramework = async function (request, h) {
  const { complementaryCertificationKey } = request.params;
  const { version, calibrationId } = request.payload.data.attributes;
  await usecases.calibrateConsolidatedFramework({ version, calibrationId, complementaryCertificationKey });

  return h.response().code(200);
};

const getCurrentConsolidatedFramework = async function (request) {
  const { complementaryCertificationKey } = request.params;

  const currentConsolidatedFramework = await usecases.getCurrentConsolidatedFramework({
    complementaryCertificationKey,
  });

  return certificationConsolidatedFrameworkSerializer.serialize(currentConsolidatedFramework);
};

const getComplementaryCertificationTargetProfileHistory = async function (request) {
  const complementaryCertificationId = request.params.complementaryCertificationId;
  const complementaryCertification = await usecases.getComplementaryCertificationTargetProfileHistory({
    complementaryCertificationId,
  });
  return complementaryCertificationSerializer.serializeForAdmin(complementaryCertification);
};

const complementaryCertificationController = {
  findComplementaryCertifications,
  searchAttachableTargetProfilesForComplementaryCertifications,
  createConsolidatedFramework,
  getCurrentConsolidatedFramework,
  calibrateConsolidatedFramework,
  getComplementaryCertificationTargetProfileHistory,
};
export { complementaryCertificationController };
