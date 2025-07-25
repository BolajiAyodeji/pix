/**
 * @typedef {import ('../../../../shared/domain/models/TargetProfileHistoryForAdmin.js').TargetProfileHistoryForAdmin} TargetProfileHistoryForAdmin
 */

class ComplementaryCertificationTargetProfileHistory {
  /**
   * @param {Object} params
   * @param {number} params.id - identifier of the complementary certification
   * @param {string} params.key
   * @param {string} params.label
   * @param {boolean} params.hasExternalJury
   * @param {Array<TargetProfileHistoryForAdmin>} params.targetProfilesHistory
   */
  constructor({ id, key, label, hasExternalJury, targetProfilesHistory }) {
    this.id = id;
    this.key = key;
    this.label = label;
    this.hasExternalJury = hasExternalJury;
    this.targetProfilesHistory = targetProfilesHistory;
  }
}

export { ComplementaryCertificationTargetProfileHistory };
