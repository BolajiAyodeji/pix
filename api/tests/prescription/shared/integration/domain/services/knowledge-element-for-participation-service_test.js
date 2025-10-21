import _ from 'lodash';

import { CampaignTypes } from '../../../../../../src/prescription/shared/domain/constants.js';
import { KnowledgeElementCollection } from '../../../../../../src/prescription/shared/domain/models/KnowledgeElementCollection.js';
import * as knowledgeElementForParticipationService from '../../../../../../src/prescription/shared/domain/services/knowledge-element-for-participation-service.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { Assessment } from '../../../../../../src/shared/domain/models/Assessment.js';
import { KnowledgeElement } from '../../../../../../src/shared/domain/models/KnowledgeElement.js';
import { catchErr, databaseBuilder, domainBuilder, expect, knex, sinon } from '../../../../../test-helper.js';

describe('Integration | Prescription | Shared | Service | KnowledgeElementForParticipationService', function () {
  describe('#saveForCampaignParticipation', function () {
    let knowledgeElementsToSave;

    beforeEach(function () {
      // given
      knowledgeElementsToSave = [];
      const userId = databaseBuilder.factory.buildUser({}).id;
      const assessmentId = databaseBuilder.factory.buildAssessment({ userId }).id;
      const answerId1 = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
      const answerId2 = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
      knowledgeElementsToSave.push(
        domainBuilder.buildKnowledgeElement({
          userId,
          assessmentId,
          answerId: answerId1,
          competenceId: 'recABC',
          skillId: 'nouvelAcquis1',
        }),
      );
      knowledgeElementsToSave.push(
        domainBuilder.buildKnowledgeElement({
          userId,
          assessmentId,
          answerId: answerId2,
          competenceId: 'recABC',
          skillId: 'nouvelAcquis2',
        }),
      );

      return databaseBuilder.commit();
    });

    context('when campaign participation is invalid', function () {
      it('should throw an Error without saving anything when campaign participation does not refer to existing entities', async function () {
        // when
        const err = await catchErr(knowledgeElementForParticipationService.save)({
          knowledgeElements: knowledgeElementsToSave,
          campaignParticipationId: 456,
        });

        // then
        const [{ count }] = await knex('knowledge-elements').count();
        expect(count).to.equal(0);
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal('Invalid campaign participation 456');
      });

      it('should throw an Error without saving anything when campaign participation is not defined', async function () {
        // when
        const err = await catchErr(knowledgeElementForParticipationService.save)({
          knowledgeElements: knowledgeElementsToSave,
          campaignParticipationId: null,
        });

        // then
        const [{ count }] = await knex('knowledge-elements').count();
        expect(count).to.equal(0);
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal('Invalid campaign participation null');
      });
    });

    context('when campaign participation is valid', function () {
      context('when campaign is of type PROFILES_COLLECTION', function () {
        it('should not save anything in DB and throw an error', async function () {
          // given
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.PROFILES_COLLECTION }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          await databaseBuilder.commit();

          // when
          const err = await catchErr(knowledgeElementForParticipationService.save)({
            knowledgeElements: knowledgeElementsToSave,
            campaignParticipationId,
          });

          // then
          const [{ count }] = await knex('knowledge-elements').count();
          expect(count).to.equal(0);
          expect(err).to.be.instanceOf(Error);
          expect(err.message).to.equal('Saving knowledge-elements for campaign of type undefined not implemented');
        });
      });

      context('when campaign is of type ASSESSMENT', function () {
        it('should save all the knowledgeElements in table "knowledge-elements"', async function () {
          // given
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.ASSESSMENT }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          await databaseBuilder.commit();

          // when
          await knowledgeElementForParticipationService.save({
            knowledgeElements: knowledgeElementsToSave,
            campaignParticipationId,
          });

          // then
          const keFromDB = await knex('knowledge-elements').orderBy('skillId');
          expect(keFromDB.length).to.equal(2);
          expect(_.omit(keFromDB[0], ['createdAt', 'id'])).to.deep.equal(
            _.omit(knowledgeElementsToSave[0], ['createdAt', 'id']),
          );
          expect(_.omit(keFromDB[1], ['createdAt', 'id'])).to.deep.equal(
            _.omit(knowledgeElementsToSave[1], ['createdAt', 'id']),
          );
        });
      });

      context('when campaign is of type EXAM', function () {
        let clock;

        beforeEach(function () {
          clock = sinon.useFakeTimers(new Date('2021-10-29'));
        });

        afterEach(function () {
          clock.restore();
        });

        context('when a snapshot for this participation already exists', function () {
          it('should save the knowledge elements through an updated snapshot', async function () {
            // given
            const userId = databaseBuilder.factory.buildUser().id;
            const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.EXAM }).id;
            const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
              campaignId,
              userId,
            }).id;
            const knowledgeElement1 = domainBuilder.buildKnowledgeElement({
              userId,
              createdAt: new Date('2019-03-01'),
              skillId: 'acquis1',
            });
            const knowledgeElement2 = domainBuilder.buildKnowledgeElement({
              userId,
              createdAt: new Date('2019-03-01'),
              skillId: 'acquis2',
            });
            const knowledgeElementsBefore = new KnowledgeElementCollection([knowledgeElement1, knowledgeElement2]);
            databaseBuilder.factory.buildKnowledgeElementSnapshot({
              campaignParticipationId,
              snapshot: knowledgeElementsBefore.toSnapshot(),
            });
            await databaseBuilder.commit();

            // when
            await knowledgeElementForParticipationService.save({
              knowledgeElements: knowledgeElementsToSave,
              campaignParticipationId,
            });

            // then
            const [{ count }] = await knex('knowledge-elements').count();
            expect(count).to.equal(0);
            const snapshotForParticipation = await knex('knowledge-element-snapshots')
              .select('campaignParticipationId', 'snapshot')
              .where({ campaignParticipationId })
              .first();
            expect(snapshotForParticipation).to.deep.equal({
              campaignParticipationId,
              snapshots: [
                {
                  ...knowledgeElementsToSave[0],
                  assessmentId: undefined,
                  answerId: undefined,
                  userId: undefined,
                  id: undefined,
                  createdAt: new Date(),
                },
                {
                  ...knowledgeElementsToSave[1],
                  assessmentId: undefined,
                  answerId: undefined,
                  userId: undefined,
                  id: undefined,
                  createdAt: new Date(),
                },
                {
                  ...knowledgeElement1,
                  assessmentId: undefined,
                  answerId: undefined,
                  userId: undefined,
                  id: undefined,
                },
                {
                  ...knowledgeElement2,
                  assessmentId: undefined,
                  answerId: undefined,
                  userId: undefined,
                  id: undefined,
                },
              ],
            });
          });
        });

        context('when there is no snapshot for this participation', function () {
          it('should save the knowledge elements through a new snapshot', async function () {
            // given
            const userId = databaseBuilder.factory.buildUser().id;
            const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.EXAM }).id;
            const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
              campaignId,
              userId,
            }).id;
            await databaseBuilder.commit();

            // when
            await knowledgeElementForParticipationService.save({
              knowledgeElements: knowledgeElementsToSave,
              campaignParticipationId,
            });

            // then
            const [{ count }] = await knex('knowledge-elements').count();
            expect(count).to.equal(0);
            const snapshotForParticipation = await knex('knowledge-element-snapshots')
              .select('campaignParticipationId', 'snapshot')
              .where({ campaignParticipationId })
              .first();
            expect(snapshotForParticipation).to.deep.equal({
              campaignParticipationId,
              knowledgeElements: [
                {
                  ...knowledgeElementsToSave[0],
                  assessmentId: undefined,
                  answerId: undefined,
                  userId: undefined,
                  id: undefined,
                  createdAt: new Date(),
                },
                {
                  ...knowledgeElementsToSave[1],
                  assessmentId: undefined,
                  answerId: undefined,
                  userId: undefined,
                  id: undefined,
                  createdAt: new Date(),
                },
              ],
            });
          });
        });
      });
    });
  });

  xdescribe('#findUniqByUserIdForCampaignParticipation', function () {
    context('when participation ID does not refer to an existing participation', function () {
      it('should return null', async function () {
        // given
        const userId = databaseBuilder.factory.buildUser().id;
        const assessmentId = databaseBuilder.factory.buildAssessment().id;
        const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
        const domainKE = domainBuilder.buildKnowledgeElement({
          userId,
          skillId: 'acquisABC123',
          answerId,
          assessmentId,
        });
        databaseBuilder.factory.buildKnowledgeElementSnapshot({
          userId: userId,
          snapshot: new KnowledgeElementCollection([domainKE]).toSnapshot(),
        });
        databaseBuilder.factory.buildKnowledgeElement(domainKE);
        await databaseBuilder.commit();

        // when
        const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId: 777,
        });

        // then
        expect(res).to.be.null;
      });
    });

    context('when campaign is of an unknown type', function () {
      it('should return null', async function () {
        // given
        const userId = databaseBuilder.factory.buildUser().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ type: 'Bouloulou' }).id;
        const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
        }).id;
        const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
        const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
        const domainKEInSnapshot = domainBuilder.buildKnowledgeElement({
          id: 1,
          userId,
          skillId: 'acquisABC123',
          answerId,
          assessmentId,
          createdAt: new Date('2021-01-01'),
        });
        const domainKENotInSnapshot = domainBuilder.buildKnowledgeElement({
          id: 2,
          userId,
          skillId: 'acquisDEF456',
          answerId,
          assessmentId,
          createdAt: new Date('2022-01-01'),
        });
        databaseBuilder.factory.buildKnowledgeElementSnapshot({
          userId: userId,
          campaignParticipationId,
          snapshot: new KnowledgeElementCollection([domainKEInSnapshot]).toSnapshot(),
        });
        databaseBuilder.factory.buildKnowledgeElement(domainKEInSnapshot);
        databaseBuilder.factory.buildKnowledgeElement(domainKENotInSnapshot);
        await databaseBuilder.commit();

        // when
        const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId,
        });

        // then
        expect(res).to.be.null;
      });
    });

    context('when campaign is of type PROFILES_COLLECTION', function () {
      context('when a limit date is provided', function () {
        it('should return the Knowledge Elements of the user before limit date', async function () {
          // given
          const limitDate = new Date('2025-01-01');
          const userId = databaseBuilder.factory.buildUser().id;
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.PROFILES_COLLECTION }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
          const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const domainKE1 = domainBuilder.buildKnowledgeElement({
            id: 1,
            userId,
            skillId: 'acquisABC123',
            answerId,
            assessmentId,
            createdAt: new Date('2021-01-01'),
          });
          const domainKE2 = domainBuilder.buildKnowledgeElement({
            id: 2,
            userId,
            skillId: 'acquisDEF456',
            answerId,
            assessmentId,
            createdAt: new Date('2022-01-01'),
          });
          const afterDateKE3 = domainBuilder.buildKnowledgeElement({
            id: 3,
            userId,
            skillId: 'acquisJHI789',
            answerId,
            assessmentId,
            createdAt: new Date('2026-01-01'),
          });
          databaseBuilder.factory.buildKnowledgeElement(domainKE1);
          databaseBuilder.factory.buildKnowledgeElement(domainKE2);
          databaseBuilder.factory.buildKnowledgeElement(afterDateKE3);
          await databaseBuilder.commit();

          // when
          const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
            userId,
            campaignParticipationId,
            limitDate,
          });

          // then
          expect(res).to.deep.equal([domainKE2, domainKE1]);
        });
      });

      context('when no limit date is provided', function () {
        it('should return the Knowledge Elements of the user regardless of date', async function () {
          // given
          const userId = databaseBuilder.factory.buildUser().id;
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.PROFILES_COLLECTION }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
          const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const domainKE1 = domainBuilder.buildKnowledgeElement({
            id: 1,
            userId,
            skillId: 'acquisABC123',
            answerId,
            assessmentId,
            createdAt: new Date('2021-01-01'),
          });
          const domainKE2 = domainBuilder.buildKnowledgeElement({
            id: 2,
            userId,
            skillId: 'acquisDEF456',
            answerId,
            assessmentId,
            createdAt: new Date('2022-01-01'),
          });
          databaseBuilder.factory.buildKnowledgeElement(domainKE1);
          databaseBuilder.factory.buildKnowledgeElement(domainKE2);
          await databaseBuilder.commit();

          // when
          const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
            userId,
            campaignParticipationId,
          });

          // then
          expect(res).to.deep.equal([domainKE2, domainKE1]);
        });
      });
    });

    context('when campaign is of type ASSESSMENT', function () {
      context('when a limit date is provided', function () {
        it('should return the Knowledge Elements of the user before limitdate', async function () {
          // given
          const limitDate = new Date('2025-01-01');
          const userId = databaseBuilder.factory.buildUser().id;
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.ASSESSMENT }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
          const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const domainKE1 = domainBuilder.buildKnowledgeElement({
            id: 1,
            userId,
            skillId: 'acquisABC123',
            answerId,
            assessmentId,
            createdAt: new Date('2021-01-01'),
          });
          const domainKE2 = domainBuilder.buildKnowledgeElement({
            id: 2,
            userId,
            skillId: 'acquisDEF456',
            answerId,
            assessmentId,
            createdAt: new Date('2022-01-01'),
          });
          const afterDateKE3 = domainBuilder.buildKnowledgeElement({
            id: 3,
            userId,
            skillId: 'acquisJHI789',
            answerId,
            assessmentId,
            createdAt: new Date('2026-01-01'),
          });
          databaseBuilder.factory.buildKnowledgeElement(domainKE1);
          databaseBuilder.factory.buildKnowledgeElement(domainKE2);
          databaseBuilder.factory.buildKnowledgeElement(afterDateKE3);
          await databaseBuilder.commit();

          // when
          const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
            userId,
            campaignParticipationId,
            limitDate,
          });

          // then
          expect(res).to.deep.equal([domainKE2, domainKE1]);
        });
      });

      context('when no limit date is provided', function () {
        it('should return the Knowledge Elements of the user regardless of date', async function () {
          // given
          const userId = databaseBuilder.factory.buildUser().id;
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.ASSESSMENT }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
          const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const domainKE1 = domainBuilder.buildKnowledgeElement({
            id: 1,
            userId,
            skillId: 'acquisABC123',
            answerId,
            assessmentId,
            createdAt: new Date('2021-01-01'),
          });
          const domainKE2 = domainBuilder.buildKnowledgeElement({
            id: 2,
            userId,
            skillId: 'acquisDEF456',
            answerId,
            assessmentId,
            createdAt: new Date('2022-01-01'),
          });
          databaseBuilder.factory.buildKnowledgeElement(domainKE1);
          databaseBuilder.factory.buildKnowledgeElement(domainKE2);
          await databaseBuilder.commit();

          // when
          const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
            userId,
            campaignParticipationId,
          });

          // then
          expect(res).to.deep.equal([domainKE2, domainKE1]);
        });
      });
    });

    context('when campaign is of type EXAM', function () {
      context('when there is no snapshot for participation', function () {
        it('should return an empty array', async function () {
          // given
          const userId = databaseBuilder.factory.buildUser().id;
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.EXAM }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
          const competenceEvaluationAssessmentId = databaseBuilder.factory.buildAssessment({
            type: Assessment.types.COMPETENCE_EVALUATION,
          }).id;
          const otherAnswerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const domainKEOutsideOfParticipation = domainBuilder.buildKnowledgeElement({
            id: 1,
            userId,
            skillId: 'acquisABC123',
            answerId: otherAnswerId,
            assessmentId: competenceEvaluationAssessmentId,
            createdAt: new Date('2021-01-01'),
          });
          databaseBuilder.factory.buildKnowledgeElement(domainKEOutsideOfParticipation);
          await databaseBuilder.commit();

          // when
          const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
            userId,
            campaignParticipationId,
          });

          // then
          expect(res).to.deep.equal([]);
        });
      });

      context('when there is a snapshot for participation', function () {
        it('should return the Knowledge Elements in the snapshot', async function () {
          // given
          const userId = databaseBuilder.factory.buildUser().id;
          const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.EXAM }).id;
          const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
            campaignId,
          }).id;
          const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
          const competenceEvaluationAssessmentId = databaseBuilder.factory.buildAssessment({
            type: Assessment.types.COMPETENCE_EVALUATION,
          }).id;
          const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const otherAnswerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
          const domainKEOutsideOfParticipation = domainBuilder.buildKnowledgeElement({
            id: 1,
            userId,
            skillId: 'acquisABC123',
            answerId: otherAnswerId,
            assessmentId: competenceEvaluationAssessmentId,
            createdAt: new Date('2021-01-01'),
          });
          const domainKEInParticipation = domainBuilder.buildKnowledgeElement({
            id: 'not_a_real_ke',
            userId,
            skillId: 'acquisDEF456',
            answerId,
            assessmentId,
            createdAt: new Date('2022-01-01'),
          });
          databaseBuilder.factory.buildKnowledgeElementSnapshot({
            userId: userId,
            campaignParticipationId,
            snapshot: new KnowledgeElementCollection([domainKEInParticipation]).toSnapshot(),
          });
          databaseBuilder.factory.buildKnowledgeElement(domainKEOutsideOfParticipation);
          await databaseBuilder.commit();

          // when
          const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
            userId,
            campaignParticipationId,
          });

          // then
          expect(res).to.deep.equal([
            new KnowledgeElement({
              ...domainKEInParticipation,
              assessmentId: undefined,
              answerId: undefined,
              id: undefined,
              userId: undefined,
            }),
          ]);
        });
      });
    });

    it('should be DomainTransaction compliant', async function () {
      // given
      const userId = databaseBuilder.factory.buildUser().id;
      const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.ASSESSMENT }).id;
      const campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
        campaignId,
        sharedAt: null,
      }).id;
      const assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
      const answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
      const domainKEInSnapshot = domainBuilder.buildKnowledgeElement({
        id: 1,
        userId,
        skillId: 'acquisABC123',
        answerId,
        assessmentId,
        createdAt: new Date('2021-01-01'),
      });
      const domainKENotInSnapshot = domainBuilder.buildKnowledgeElement({
        id: 2,
        userId,
        skillId: 'acquisDEF456',
        answerId,
        assessmentId,
        createdAt: new Date('2022-01-01'),
      });
      const extraDomainKE = domainBuilder.buildKnowledgeElement({
        id: 3,
        userId,
        skillId: 'acquisJHI789',
        answerId,
        assessmentId,
        createdAt: new Date('2023-01-01'),
      });
      databaseBuilder.factory.buildKnowledgeElementSnapshot({
        userId: userId,
        campaignParticipationId,
        snapshot: new KnowledgeElementCollection([domainKEInSnapshot]).toSnapshot(),
      });
      databaseBuilder.factory.buildKnowledgeElement(domainKEInSnapshot);
      databaseBuilder.factory.buildKnowledgeElement(domainKENotInSnapshot);
      await databaseBuilder.commit();
      const knowledgeElementsWantedTrx = [extraDomainKE, domainKENotInSnapshot, domainKEInSnapshot];

      // when
      const knowledgeElementsFound = await DomainTransaction.execute(async (domainTransaction) => {
        await domainTransaction.knexTransaction('knowledge-elements').insert(extraDomainKE);
        return repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId,
        });
      });

      // then
      expect(knowledgeElementsFound).to.deep.equal(knowledgeElementsWantedTrx);
    });

    context('KE selection', function () {
      let assessmentId, campaignParticipationId, answerId, userId;

      beforeEach(async function () {
        userId = databaseBuilder.factory.buildUser().id;
        const campaignId = databaseBuilder.factory.buildCampaign({ type: CampaignTypes.ASSESSMENT }).id;
        campaignParticipationId = databaseBuilder.factory.buildCampaignParticipation({
          campaignId,
          sharedAt: null,
        }).id;
        assessmentId = databaseBuilder.factory.buildAssessment({ campaignParticipationId }).id;
        answerId = databaseBuilder.factory.buildAnswer({ assessmentId }).id;
      });

      it('should chose most recent KE when many KEs exist for a given skill', async function () {
        // given
        const keA_old = domainBuilder.buildKnowledgeElement({
          id: 1,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2021-01-01'),
          status: KnowledgeElement.StatusType.VALIDATED,
        });
        const keA_new = domainBuilder.buildKnowledgeElement({
          id: 2,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2022-01-01'),
          status: KnowledgeElement.StatusType.INVALIDATED,
        });
        databaseBuilder.factory.buildKnowledgeElement(keA_old);
        databaseBuilder.factory.buildKnowledgeElement(keA_new);
        await databaseBuilder.commit();

        // when
        const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId,
        });

        // then
        expect(res).to.deep.equal([keA_new]);
      });

      it('should ignore all KE of a given skill when most recent one is a RESET', async function () {
        // given
        const keA_old = domainBuilder.buildKnowledgeElement({
          id: 1,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2021-01-01'),
          status: KnowledgeElement.StatusType.VALIDATED,
        });
        const keA_new = domainBuilder.buildKnowledgeElement({
          id: 2,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2022-01-01'),
          status: KnowledgeElement.StatusType.RESET,
        });
        databaseBuilder.factory.buildKnowledgeElement(keA_old);
        databaseBuilder.factory.buildKnowledgeElement(keA_new);
        await databaseBuilder.commit();

        // when
        const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId,
        });

        // then
        expect(res).to.deep.equal([]);
      });

      it('should chose most recent KE when many KEs exist for a given skill, even if there are some RESET KEs', async function () {
        // given
        const keA_super_old = domainBuilder.buildKnowledgeElement({
          id: 1,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2021-01-01'),
          status: KnowledgeElement.StatusType.VALIDATED,
        });
        const keA_old = domainBuilder.buildKnowledgeElement({
          id: 2,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2022-01-01'),
          status: KnowledgeElement.StatusType.RESET,
        });
        const keA_new = domainBuilder.buildKnowledgeElement({
          id: 3,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2023-01-01'),
          status: KnowledgeElement.StatusType.INVALIDATED,
        });
        databaseBuilder.factory.buildKnowledgeElement(keA_old);
        databaseBuilder.factory.buildKnowledgeElement(keA_new);
        databaseBuilder.factory.buildKnowledgeElement(keA_super_old);
        await databaseBuilder.commit();

        // when
        const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId,
        });

        // then
        expect(res).to.deep.equal([keA_new]);
      });

      it('should return knowledge elements ordered by created at date, descending', async function () {
        // given
        const keA = domainBuilder.buildKnowledgeElement({
          id: 1,
          userId,
          skillId: 'acquisA',
          answerId,
          assessmentId,
          createdAt: new Date('2021-01-01'),
          status: KnowledgeElement.StatusType.VALIDATED,
        });
        const keB = domainBuilder.buildKnowledgeElement({
          id: 2,
          userId,
          skillId: 'acquisB',
          answerId,
          assessmentId,
          createdAt: new Date('2020-01-01'),
          status: KnowledgeElement.StatusType.INVALIDATED,
        });
        databaseBuilder.factory.buildKnowledgeElement(keA);
        databaseBuilder.factory.buildKnowledgeElement(keB);
        await databaseBuilder.commit();

        // when
        const res = await repositories.knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
          userId,
          campaignParticipationId,
        });

        // then
        expect(res).to.deep.equal([keA, keB]);
      });
    });
  });
});
