/**
 * @typedef {import ('./index.js').ComplementaryCertificationForTargetProfileAttachmentRepository} ComplementaryCertificationForTargetProfileAttachmentRepository
 */

/**
 * @param {Object} params
 * @param {ComplementaryCertificationForTargetProfileAttachmentRepository} params.complementaryCertificationForTargetProfileAttachmentRepository
 */
export const getComplementaryCertificationForTargetProfileAttachmentRepository = async function ({
  complementaryCertificationId,
  complementaryCertificationForTargetProfileAttachmentRepository,
}) {
  return complementaryCertificationForTargetProfileAttachmentRepository.getById({
    complementaryCertificationId,
  });
};
