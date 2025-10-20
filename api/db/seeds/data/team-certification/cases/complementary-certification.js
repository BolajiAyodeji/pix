import { usecases as certificationConfigurationUsecases } from '../../../../../src/certification/configuration/domain/usecases/index.js';
import { complementaryCertifications } from './complementary-certifications.js';

export class ComplementaryCertificationSeed {
  constructor({ databaseBuilder }) {
    this.databaseBuilder = databaseBuilder;
  }

  async create() {
    complementaryCertifications.forEach((complementaryCertification) => {
      const tubeIds = complementaryCertification.tubeIds;
      const scope = complementaryCertification.complementaryCertificationKey;
      certificationConfigurationUsecases.createCertificationVersion({ scope, tubeIds });
    });
  }
}
