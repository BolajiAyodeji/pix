import { AlgorithmEngineVersion } from '../../../shared/domain/models/AlgorithmEngineVersion.js';

class CertificationCourseVersion {
  /**
   * @param {Object} props
   * @param {number} props.version
   */
  constructor({ version }) {
    this.version = version;
  }

  isV2() {
    return AlgorithmEngineVersion.isV2(this.version);
  }

  isV3() {
    return AlgorithmEngineVersion.isV3(this.version);
  }
}

export { CertificationCourseVersion };
