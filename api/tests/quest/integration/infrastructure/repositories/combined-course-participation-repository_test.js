import sinon from 'sinon';

import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import { CombinedCourseParticipation } from '../../../../../src/quest/domain/models/CombinedCourseParticipation.js';
import {
  OrganizationLearnerParticipationStatuses,
  OrganizationLearnerParticipationTypes,
} from '../../../../../src/quest/domain/models/OrganizationLearnerParticipation.js';
import * as combinedCourseParticipationRepository from '../../../../../src/quest/infrastructure/repositories/combined-course-participation-repository.js';
import { NotFoundError } from '../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect, knex } from '../../../../test-helper.js';

describe('Quest | Integration | Infrastructure | repositories | Combined-Course-Participation', function () {
  describe('#save', function () {
    it('should insert organization learner participations of type combined course', async function () {
      //given
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner().id;
      const { id: combinedCourseId } = databaseBuilder.factory.buildCombinedCourse();

      await databaseBuilder.commit();

      //when
      await combinedCourseParticipationRepository.save({
        organizationLearnerId,
        combinedCourseId,
      });

      //then
      const participations = await knex('organization_learner_participations')
        .select(
          'id as combinedCourseParticipationId',
          'referenceId as combinedCourseParticipationsCombinedCourseId',
          'status as combinedCourseParticipationStatus',
          'organizationLearnerId as combinedCourseParticipationsOrganizationLearnerId',
          'createdAt as combinedCourseParticipationsCreatedAt',
          'updatedAt as combinedCourseParticipationsUpdatedAt',
          'type',
        )
        .where({
          'organization_learner_participations.organizationLearnerId': organizationLearnerId,
          referenceId: combinedCourseId,
        });

      expect(participations).to.have.lengthOf(1);

      const participation = participations[0];

      expect(participation.combinedCourseParticipationsCombinedCourseId).equal(combinedCourseId.toString());
      expect(participation.combinedCourseParticipationStatus).equal(CombinedCourseParticipationStatuses.STARTED);
      expect(participation.type).equal(OrganizationLearnerParticipationTypes.COMBINED_COURSE);
      expect(participation.combinedCourseParticipationsOrganizationLearnerId).equal(organizationLearnerId);
    });

    it('should left intact combined course participation for given organization learner and quest ids', async function () {
      // given
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner().id;
      const { questId, id: combinedCourseId } = databaseBuilder.factory.buildCombinedCourse();
      databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId,
        combinedCourseId,
        status: CombinedCourseParticipationStatuses.COMPLETED,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
      });
      await databaseBuilder.commit();

      // when
      await combinedCourseParticipationRepository.save({ organizationLearnerId, questId });

      // then
      const participations = await knex('organization_learner_participations').where({
        organizationLearnerId,
        referenceId: combinedCourseId.toString(),
      });

      expect(participations).to.have.lengthOf(1);
      expect(participations[0].organizationLearnerId).to.deep.equal(organizationLearnerId);
      expect(participations[0].status).to.deep.equal(CombinedCourseParticipationStatuses.COMPLETED);
      expect(participations[0].referenceId).to.deep.equal(combinedCourseId.toString());
    });
  });

  describe('#getByUserId', function () {
    it('should return quest participation for given user and quest', async function () {
      // given
      const userId = databaseBuilder.factory.buildUser().id;
      const {
        firstName,
        lastName,
        id: organizationLearnerId,
      } = databaseBuilder.factory.buildOrganizationLearner({ userId });
      const { id: combinedCourseId } = databaseBuilder.factory.buildCombinedCourse();
      databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId,
        status: OrganizationLearnerParticipationStatuses.COMPLETED,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
        combinedCourseId,
      });
      await databaseBuilder.commit();

      // when
      const result = await combinedCourseParticipationRepository.getByUserId({ userId, combinedCourseId });

      // then
      expect(result.id).to.be.finite;
      expect(result.combinedCourseId).to.deep.equal(combinedCourseId);
      expect(result.organizationLearnerId).to.deep.equal(organizationLearnerId);
      expect(result.firstName).equal(firstName);
      expect(result.lastName).equal(lastName);
      expect(result.status).to.deep.equal(OrganizationLearnerParticipationStatuses.COMPLETED);
    });

    it('should throw NotFound error when quest participation does not exist for given user and quest', async function () {
      // given
      const userId = 1;
      const combinedCourseId = 2;

      // when
      const error = await catchErr(combinedCourseParticipationRepository.getByUserId)({ userId, combinedCourseId });

      // then
      expect(error).to.be.instanceof(NotFoundError);
      expect(error.message).to.equal(
        `CombinedCourseParticipation introuvable pour l'utilisateur d'id ${userId} et au parcours d'id ${combinedCourseId}`,
      );
    });
  });

  describe('#findUserIdsById', function () {
    it('should return user ids only for given quest id', async function () {
      //given
      const { id: combinedCourseId, organizationId } = databaseBuilder.factory.buildCombinedCourse();

      const { id: organizationLearnerId1, userId: userId1 } = databaseBuilder.factory.buildOrganizationLearner({
        organizationId,
      });
      const { id: organizationLearnerId2, userId: userId2 } = databaseBuilder.factory.buildOrganizationLearner({
        organizationId,
      });

      databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId: organizationLearnerId1,
        combinedCourseId,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
        status: OrganizationLearnerParticipationStatuses.STARTED,
      });
      databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId: organizationLearnerId2,
        combinedCourseId,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
        status: OrganizationLearnerParticipationStatuses.STARTED,
      });

      const { id: anotherCombinedCourseId } = databaseBuilder.factory.buildCombinedCourse({
        organizationId,
        code: 'anotherQuest',
      });
      databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId: organizationLearnerId1,
        combinedCourseId: anotherCombinedCourseId,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
        status: OrganizationLearnerParticipationStatuses.STARTED,
      });

      await databaseBuilder.commit();

      // when
      const { userIds } = await combinedCourseParticipationRepository.findUserIdsById({ combinedCourseId });

      // then
      expect(userIds).deep.equal([userId1, userId2]);
    });
  });

  describe('#update', function () {
    let clock;
    const now = new Date('2025-07-07');

    beforeEach(function () {
      clock = sinon.useFakeTimers({ now, toFake: ['Date'] });
    });

    afterEach(function () {
      clock.restore();
    });

    it('should update only status and updatedAt for given id', async function () {
      //given
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner().id;
      const { id: combinedCourseId } = databaseBuilder.factory.buildCombinedCourse();
      const combinedCourseParticipationFromDB = databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId,
        status: OrganizationLearnerParticipationStatuses.STARTED,
        createdAt: new Date('2022-01-01'),
        updatedAt: new Date('2022-01-01'),
        combinedCourseId,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
        referenceId: combinedCourseId.toString(),
      });

      await databaseBuilder.commit();

      //when
      const combinedCourseParticipation = new CombinedCourseParticipation({
        ...combinedCourseParticipationFromDB,
        questId: 1,
        organizationLearnerId: 1,
      });

      combinedCourseParticipation.complete();

      const updatedParticipation = await combinedCourseParticipationRepository.update({
        combinedCourseParticipation,
      });

      //then
      expect(updatedParticipation.id).to.equal(combinedCourseParticipationFromDB.id);
      expect(updatedParticipation.organizationLearnerId).to.equal(
        combinedCourseParticipationFromDB.organizationLearnerId,
      );
      expect(updatedParticipation.questId).to.equal(combinedCourseParticipationFromDB.questId);
      expect(updatedParticipation.status).to.deep.equal(CombinedCourseParticipationStatuses.COMPLETED);
      expect(updatedParticipation.updatedAt).to.deep.equal(now);
    });
  });

  describe('#findByCombinedCourseIds', function () {
    it('should return a paginated list of participations for given quest IDs', async function () {
      // given
      const { id: combinedCourseId1, organizationId } = databaseBuilder.factory.buildCombinedCourse({
        code: 'COMBI1',
      });
      const { id: combinedCourseId2 } = databaseBuilder.factory.buildCombinedCourse({
        code: 'COMBI2',
        organizationId,
      });
      const { id: combinedCourseId3 } = databaseBuilder.factory.buildCombinedCourse({
        code: 'COMBI3',
      });

      const learner1 = databaseBuilder.factory.buildOrganizationLearner({
        firstName: 'Alice',
        lastName: 'Azerty',
        organizationId,
      });
      const learner2 = databaseBuilder.factory.buildOrganizationLearner({
        firstName: 'Bob',
        lastName: 'Bernard',
        organizationId,
      });

      const participation1 = databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId: learner1.id,
        status: CombinedCourseParticipationStatuses.COMPLETED,
        combinedCourseId: combinedCourseId1,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
      });
      const participation2 = databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId: learner2.id,
        status: CombinedCourseParticipationStatuses.STARTED,
        combinedCourseId: combinedCourseId2,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
      });
      // Participation that should not be included
      databaseBuilder.factory.buildOrganizationLearnerParticipation({
        organizationLearnerId: learner1.id,
        status: CombinedCourseParticipationStatuses.COMPLETED,
        combinedCourseId: combinedCourseId3,
        type: OrganizationLearnerParticipationTypes.COMBINED_COURSE,
      });

      await databaseBuilder.commit();

      // when
      const { combinedCourseParticipations, meta } =
        await combinedCourseParticipationRepository.findByCombinedCourseIds({
          combinedCourseIds: [combinedCourseId1, combinedCourseId2],
        });

      // then
      expect(meta).deep.equal({ page: 1, pageSize: 10, rowCount: 2, pageCount: 1 });

      expect(combinedCourseParticipations).lengthOf(2);
      expect(combinedCourseParticipations[0]).instanceOf(CombinedCourseParticipation);
      expect(combinedCourseParticipations[1]).instanceOf(CombinedCourseParticipation);

      expect(combinedCourseParticipations).deep.equal([
        {
          id: participation1.id,
          firstName: learner1.firstName,
          lastName: learner1.lastName,
          status: CombinedCourseParticipationStatuses.COMPLETED,
          createdAt: participation1.createdAt,
          updatedAt: participation1.updatedAt,
          organizationLearnerId: learner1.id,
          questId: undefined,
          organizationLearnerParticipationId: null,
        },
        {
          id: participation2.id,
          firstName: learner2.firstName,
          lastName: learner2.lastName,
          status: CombinedCourseParticipationStatuses.STARTED,
          createdAt: participation2.createdAt,
          updatedAt: participation2.updatedAt,
          organizationLearnerId: learner2.id,
          questId: undefined,
          organizationLearnerParticipationId: null,
        },
      ]);
    });

    it('should return empty array when no participations match the quest IDs', async function () {
      // given
      const { id: combinedCourseId1 } = databaseBuilder.factory.buildCombinedCourse({ code: 'COMBI1' });
      const { id: combinedCourseId2 } = databaseBuilder.factory.buildCombinedCourse({ code: 'COMBI2' });
      await databaseBuilder.commit();

      // when
      const { combinedCourseParticipations, meta } =
        await combinedCourseParticipationRepository.findByCombinedCourseIds({
          combinedCourseIds: [combinedCourseId1, combinedCourseId2],
        });

      // then
      expect(meta).deep.equal({ page: 1, pageSize: 10, rowCount: 0, pageCount: 0 });
      expect(combinedCourseParticipations).to.deep.equal([]);
    });

    it('should return the second page of participations for a given questId', async function () {
      // given
      const {
        id: combinedCourseId1,
        questId: questId1,
        organizationId,
      } = databaseBuilder.factory.buildCombinedCourse({
        code: 'COMBI1',
      });
      const { id: combinedCourseId2, questId: questId2 } = databaseBuilder.factory.buildCombinedCourse({
        code: 'COMBI2',
        organizationId,
      });
      const { id: combinedCourseId3, questId: questId3 } = databaseBuilder.factory.buildCombinedCourse({
        code: 'COMBI3',
      });

      const learner1 = databaseBuilder.factory.buildOrganizationLearner({
        firstName: 'Alice',
        lastName: 'Azerty',
        organizationId,
      });
      const learner2 = databaseBuilder.factory.buildOrganizationLearner({
        firstName: 'Bob',
        lastName: 'Bernard',
        organizationId,
      });

      databaseBuilder.factory.buildCombinedCourseParticipation({
        organizationLearnerId: learner1.id,
        questId: questId1,
        combinedCourseId: combinedCourseId1,
        status: CombinedCourseParticipationStatuses.COMPLETED,
      });
      const participation2 = databaseBuilder.factory.buildCombinedCourseParticipation({
        organizationLearnerId: learner2.id,
        questId: questId2,
        combinedCourseId: combinedCourseId2,
        status: CombinedCourseParticipationStatuses.STARTED,
      });
      // Participation that should not be included
      databaseBuilder.factory.buildCombinedCourseParticipation({
        organizationLearnerId: learner1.id,
        questId: questId3,
        combinedCourseId: combinedCourseId3,
        status: CombinedCourseParticipationStatuses.COMPLETED,
      });
      await databaseBuilder.commit();

      // when
      const { combinedCourseParticipations, meta } =
        await combinedCourseParticipationRepository.findByCombinedCourseIds({
          combinedCourseIds: [combinedCourseId1, combinedCourseId2],
          page: { number: 2, size: 1 },
        });

      // then
      expect(meta).deep.equal({ page: 2, pageSize: 1, rowCount: 2, pageCount: 2 });
      expect(combinedCourseParticipations).lengthOf(1);
      expect(combinedCourseParticipations[0]).instanceOf(CombinedCourseParticipation);

      expect(combinedCourseParticipations).deep.equal([
        {
          id: participation2.id,
          firstName: learner2.firstName,
          lastName: learner2.lastName,
          status: CombinedCourseParticipationStatuses.STARTED,
          organizationLearnerParticipationId: null,
          createdAt: participation2.createdAt,
          updatedAt: participation2.updatedAt,
          organizationLearnerId: learner2.id,
          questId: questId2,
        },
      ]);
    });
  });
});
