import { knex } from '../../../../db/knex-database-connection.js';
import { GiveHabilitationsBackToCenters } from '../../../../scripts/certification/give-habilitations-back-to-centers.js';
import { createTempFile, databaseBuilder, expect, sinon } from '../../../test-helper.js';

describe('Integration | Scripts | Certification | give-habilitations-back-to-centers', function () {
  const complementaryCertificationId1 = 1;
  const complementaryCertificationId2 = 2;
  const certificationCenterId1 = 1001;
  const certificationCenterId2 = 1002;

  beforeEach(async function () {
    databaseBuilder.factory.buildComplementaryCertification({
      id: complementaryCertificationId1,
      key: 'KEY_1',
    });
    databaseBuilder.factory.buildComplementaryCertification({
      id: complementaryCertificationId2,
      key: 'KEY_2',
    });
    databaseBuilder.factory.buildCertificationCenter({ id: certificationCenterId1 });
    databaseBuilder.factory.buildCertificationCenter({ id: certificationCenterId2 });

    await databaseBuilder.commit();
  });

  describe('#parse', function () {
    it('parses CSV input file with all required columns', async function () {
      // given
      const script = new GiveHabilitationsBackToCenters();
      const options = script.metaInfo.options;
      const file = 'certification-frameworks-challenges-update.csv';
      const csvData = ['complementaryCertificationId,certificationCenterId', '1, 1001', '2, 1002'].join('\n');

      const csvFilePath = await createTempFile(file, csvData);

      // when
      const parsedData = await options.file.coerce(csvFilePath);

      // then
      expect(parsedData).to.deep.equal([
        {
          complementaryCertificationId: complementaryCertificationId1,
          certificationCenterId: certificationCenterId1,
        },
        {
          complementaryCertificationId: complementaryCertificationId2,
          certificationCenterId: certificationCenterId2,
        },
      ]);
    });

    it('should fail when required columns are missing', async function () {
      // given
      const script = new GiveHabilitationsBackToCenters();
      const options = script.metaInfo.options;
      const file = 'invalid-certification-frameworks-challenges.csv';
      const csvData = ['complementaryCertificationId', '10, 1001'].join('\\n');

      const csvFilePath = await createTempFile(file, csvData);

      // when/then
      await expect(options.file.coerce(csvFilePath)).to.be.rejected;
    });
  });

  describe('#handle', function () {
    it('handles empty CSV file', async function () {
      // given
      const script = new GiveHabilitationsBackToCenters();
      const logger = { info: sinon.spy(), debug: sinon.spy(), error: sinon.spy(), warn: sinon.spy() };
      const file = [];

      // when
      const result = await script.handle({ logger, options: { file, dryRun: false } });

      // then
      expect(result.processed).to.equal(0);
      expect(result.updated).to.equal(0);
      expect(logger.info).to.have.been.calledWith('No records to process');
    });

    it('runs in dry-run mode without making changes', async function () {
      // given
      const script = new GiveHabilitationsBackToCenters();
      const logger = { info: sinon.spy(), debug: sinon.spy(), error: sinon.spy(), warn: sinon.spy() };
      const file = [
        {
          complementaryCertificationId: complementaryCertificationId1,
          certificationCenterId: certificationCenterId1,
        },
        {
          complementaryCertificationId: complementaryCertificationId2,
          certificationCenterId: certificationCenterId2,
        },
      ];

      // when
      const result = await script.handle({ logger, options: { file, dryRun: true } });

      // then
      expect(result.processed).to.equal(2);
      expect(result.updated).to.equal(0);

      const createdHabilitations = await knex('complementary-certification-habilitations');

      expect(createdHabilitations).to.be.empty;
    });

    it('updates the latest version of certification-frameworks-challenges with new discriminant, difficulty and calibrationId values', async function () {
      // given
      const script = new GiveHabilitationsBackToCenters();
      const logger = { info: sinon.spy(), debug: sinon.spy(), error: sinon.spy(), warn: sinon.spy() };
      const file = [
        {
          complementaryCertificationId: complementaryCertificationId1,
          certificationCenterId: certificationCenterId1,
        },
        {
          complementaryCertificationId: complementaryCertificationId2,
          certificationCenterId: certificationCenterId2,
        },
      ];

      // when
      const result = await script.handle({ logger, options: { file, dryRun: false } });

      // then
      expect(result.processed).to.equal(2);
      expect(result.updated).to.equal(2);

      const createdHabilitations = await knex('complementary-certification-habilitations').orderBy(
        'complementaryCertificationId',
        'asc',
      );

      expect(createdHabilitations).to.have.lengthOf(2);
      expect(createdHabilitations[0].complementaryCertificationId).to.equal(complementaryCertificationId1);
      expect(createdHabilitations[0].certificationCenterId).to.equal(certificationCenterId1);
      expect(createdHabilitations[1].complementaryCertificationId).to.equal(complementaryCertificationId2);
      expect(createdHabilitations[1].certificationCenterId).to.equal(certificationCenterId2);
    });
  });
});
