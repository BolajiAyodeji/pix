import { DomainError } from '../../../shared/domain/errors.js';
import { usecases } from '../../domain/usecases/index.js';
import { ModuleStatus } from './models/ModuleStatus.js';

/**
 * @function
 * @name getUserModuleStatuses
 *
 * @param {object} params
 * @param {number} params.userId mandatory target user id
 * @param {number[]} params.moduleIds mandatory
 *
 * @typedef ModuleStatus
 * @property {number} id
 * @property {string} title
 * @property {string} slug
 * @property {duration} number
 * @property {string} status ('not_started' | 'in_progress' | 'completed')
 *
 * @returns {ModuleStatus[]}
 * @throws {BadRequestError} UserId field is missing
 */
const getUserModuleStatuses = async ({ userId, moduleIds }) => {
  if (!userId) {
    throw new DomainError('The userId is required');
  }

  if (!moduleIds || !(moduleIds.length > 0)) {
    return [];
  }

  const moduleMetadataList = await usecases.getModuleMetadataList({ ids: moduleIds });
  const userModuleStatus = await usecases.getUserModuleStatuses({ userId, moduleIds });

  const moduleMetadataId = new Map();
  moduleMetadataList.forEach((moduleMetadata) => {
    moduleMetadataId.set(moduleMetadata.id, moduleMetadata);
  });

  return userModuleStatus.map((userModuleStatus) => {
    const { id, slug, title, duration, image } = moduleMetadataId.get(userModuleStatus.moduleId);

    return new ModuleStatus({
      id,
      slug,
      title,
      status: userModuleStatus.status,
      createdAt: userModuleStatus.createdAt,
      updatedAt: userModuleStatus.updatedAt,
      terminatedAt: userModuleStatus.terminatedAt,
      duration,
      image,
    });
  });
};

export { getUserModuleStatuses };
