import * as complementaryCertificationForTargetProfileAttachmentRepository from '../../../../../../src/certification/configuration/infrastructure/repositories/complementary-certification-for-target-profile-attachment-repository.js';
import { NotFoundError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, domainBuilder, expect } from '../../../../../test-helper.js';

describe('Integration | Repository | complementary-certification-for-target-profile-attachment-repository', function () {
  describe('#getById', function () {
    it('should return the complementary certification by its id', async function () {
      // given
      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification({
        label: 'Pix+ Édu 1er degré',
        hasExternalJury: true,
      });

      await databaseBuilder.commit();

      // when
      const retrievedComplementaryCertification =
        await complementaryCertificationForTargetProfileAttachmentRepository.getById({
          complementaryCertificationId: complementaryCertification.id,
        });

      // then
      const expectedComplementaryCertification =
        domainBuilder.buildComplementaryCertificationForTargetProfileAttachment({
          ...complementaryCertification,
        });
      expect(retrievedComplementaryCertification).to.deepEqualInstance(expectedComplementaryCertification);
    });

    describe('when complementary certification does not exist', function () {
      it('should return a NotFoundError', async function () {
        // given
        databaseBuilder.factory.buildComplementaryCertification({
          id: 1,
          label: 'Pix+ Édu 1er degré',
          hasExternalJury: true,
        });

        await databaseBuilder.commit();

        // when
        const error = await catchErr(complementaryCertificationForTargetProfileAttachmentRepository.getById)({
          complementaryCertificationId: 2,
        });

        // then
        expect(error).to.deepEqualInstance(new NotFoundError('The complementary certification does not exist'));
      });
    });
  });
});
