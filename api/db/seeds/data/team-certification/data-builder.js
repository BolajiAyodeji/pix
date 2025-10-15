import { ComplementaryCertificationSeed } from './cases/complementary-certification.js';
import { CleaV3Seed } from './cases/simple-CLEA-v3.js';
import { ProSeed } from './cases/simple-pro-certification.js';
import { ScoManagingStudent } from './cases/simple-sco-managing-students-certification.js';
import { SupWithHabilitationsSeed } from './cases/sup-certification-centre-with-habilitations.js';
import { setupConfigurations } from './shared/setup-configuration.js';

async function teamCertificationDataBuilder({ databaseBuilder }) {
  // Pix platform configuration
  await setupConfigurations({ databaseBuilder });
  await new ComplementaryCertificationSeed({ databaseBuilder }).create();

  // Cases
  await new SupWithHabilitationsSeed({ databaseBuilder }).create();
  await new ProSeed({ databaseBuilder }).create();
  await new ScoManagingStudent({ databaseBuilder }).create();
  await new CleaV3Seed({ databaseBuilder }).create();
}

export { teamCertificationDataBuilder };
