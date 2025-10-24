import _ from 'lodash';

import { DEFAULT_SESSION_DURATION_MINUTES } from '../../../../../src/certification/shared/domain/constants.js';
import { ComplementaryCertificationKeys } from '../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import {
  createServer,
  databaseBuilder,
  datamartBuilder,
  expect,
  generateAuthenticatedUserRequestHeaders,
  insertUserWithRoleSuperAdmin,
  knex,
  mockLearningContent,
} from '../../../../test-helper.js';
import { buildLearningContent as learningContentBuilder } from '../../../../tooling/learning-content-builder/index.js';

describe('Certification | Configuration | Acceptance | API | complementary-certification-route', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
  });

  describe('GET /api/admin/complementary-certifications/', function () {
    it('should return 200 HTTP status code', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();
      const options = {
        method: 'GET',
        url: '/api/admin/complementary-certifications',
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
      };
      databaseBuilder.factory.buildComplementaryCertification({
        id: 1,
        label: 'Pix+ Edu 1er degré',
        key: ComplementaryCertificationKeys.PIX_PLUS_EDU_1ER_DEGRE,
      });
      databaseBuilder.factory.buildComplementaryCertification({
        id: 2,
        label: 'Cléa Numérique',
        key: ComplementaryCertificationKeys.CLEA,
        hasComplementaryReferential: false,
      });
      await databaseBuilder.commit();

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.deep.equal({
        data: [
          {
            type: 'complementary-certifications',
            id: '1',
            attributes: {
              label: 'Pix+ Edu 1er degré',
              key: ComplementaryCertificationKeys.PIX_PLUS_EDU_1ER_DEGRE,
              'has-complementary-referential': true,
            },
          },
          {
            type: 'complementary-certifications',
            id: '2',
            attributes: {
              label: 'Cléa Numérique',
              key: ComplementaryCertificationKeys.CLEA,
              'has-complementary-referential': false,
            },
          },
        ],
      });
    });
  });

  describe('GET /api/admin/complementary-certifications/target-profiles/attachable-target-profiles', function () {
    context('when no search term provided', function () {
      it('should return 200 HTTP status code', async function () {
        // given
        const superAdmin = await insertUserWithRoleSuperAdmin();
        const options = {
          method: 'GET',
          url: '/api/admin/complementary-certifications/attachable-target-profiles',
          headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        };

        databaseBuilder.factory.buildTargetProfile({
          id: 1,
          name: 'aValidResult',
          outdated: false,
        });
        await databaseBuilder.commit();

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.deep.equal({
          data: [
            {
              type: 'attachable-target-profiles',
              id: '1',
              attributes: {
                name: 'aValidResult',
              },
            },
          ],
        });
      });
    });

    context('when a search term is provided', function () {
      it('should return 200 HTTP status code', async function () {
        // given
        const superAdmin = await insertUserWithRoleSuperAdmin();
        const options = {
          method: 'GET',
          url: '/api/admin/complementary-certifications/attachable-target-profiles?searchTerm=that%20way',
          headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        };

        databaseBuilder.factory.buildTargetProfile({
          id: 1,
          name: 'Yakalelo',
          outdated: false,
        });
        databaseBuilder.factory.buildTargetProfile({
          id: 2,
          name: 'I want it that way',
          outdated: false,
        });
        await databaseBuilder.commit();

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.deep.equal({
          data: [
            {
              type: 'attachable-target-profiles',
              id: '2',
              attributes: {
                name: 'I want it that way',
              },
            },
          ],
        });
      });
    });
  });

  describe('GET /api/admin/complementary-certifications/{complementaryCertificationId}/target-profiles', function () {
    it('should return 200 HTTP status code', async function () {
      // given
      const server = await createServer();
      const complementaryCertificationId = 1;
      const superAdmin = await insertUserWithRoleSuperAdmin();
      const options = {
        method: 'GET',
        url: '/api/admin/complementary-certifications/' + complementaryCertificationId + '/target-profiles',
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
      };
      const attachedAt = new Date('2019-01-01');

      databaseBuilder.factory.buildComplementaryCertification({
        id: 3,
        label: 'Pix+ Édu 1er degré',
        hasExternalJury: true,
        key: ComplementaryCertificationKeys.PIX_PLUS_EDU_1ER_DEGRE,
      });

      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification({
        id: complementaryCertificationId,
        label: 'Pix+ Édu 2nd degré',
        hasExternalJury: true,
        key: ComplementaryCertificationKeys.PIX_PLUS_EDU_2ND_DEGRE,
      });

      const targetProfile = databaseBuilder.factory.buildTargetProfile({ id: 999, name: 'Target' });

      const badge1 = databaseBuilder.factory.buildBadge({
        id: 198,
        key: 'badge1',
        targetProfileId: targetProfile.id,
      });

      const badge2 = databaseBuilder.factory.buildBadge({
        id: 298,
        key: 'badge2',
        targetProfileId: targetProfile.id,
      });

      databaseBuilder.factory.buildComplementaryCertificationBadge({
        badgeId: badge1.id,
        label: 'another badge label',
        complementaryCertificationId: complementaryCertification.id,
        createdAt: attachedAt,
        minimumEarnedPix: 100,
      });

      databaseBuilder.factory.buildComplementaryCertificationBadge({
        badgeId: badge2.id,
        label: 'badge label',
        complementaryCertificationId: complementaryCertification.id,
        createdAt: attachedAt,
        minimumEarnedPix: 150,
      });

      await databaseBuilder.commit();

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.deep.equal({
        data: {
          type: 'complementary-certifications',
          id: '1',
          attributes: {
            label: 'Pix+ Édu 2nd degré',
            key: 'EDU_2ND_DEGRE',
            'has-external-jury': true,
            'target-profiles-history': [
              {
                id: 999,
                name: 'Target',
                attachedAt,
                detachedAt: null,
                badges: [
                  {
                    id: 198,
                    level: 1,
                    label: 'another badge label',
                    imageUrl: 'http://badge-image-url.fr',
                    minimumEarnedPix: 100,
                  },
                  {
                    id: 298,
                    level: 1,
                    label: 'badge label',
                    imageUrl: 'http://badge-image-url.fr',
                    minimumEarnedPix: 150,
                  },
                ],
              },
            ],
          },
        },
      });
    });
  });

  describe('POST /api/admin/complementary-certifications/{complementaryCertificationKey}/consolidated-framework', function () {
    it('should return 201 HTTP status code and create a new framework', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();

      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();
      const tubeId = 'myTubeId';
      const skill = databaseBuilder.factory.learningContent.buildSkill({
        tubeId,
        status: 'actif',
      });
      const tube1 = databaseBuilder.factory.learningContent.buildTube({ id: tubeId, skillIds: [skill.id] });
      const challenge = databaseBuilder.factory.learningContent.buildChallenge({
        skillId: skill.id,
        discriminant: 2.1,
        difficulty: 3.4,
        status: 'validé',
        locales: ['fr-fr'],
      });

      await databaseBuilder.commit();

      const options = {
        method: 'POST',
        url: `/api/admin/complementary-certifications/${complementaryCertification.key}/consolidated-framework`,
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        payload: {
          data: {
            attributes: {
              tubeIds: [tube1.id],
            },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(201);
      expect(response.result.data.type).to.equal('certification-consolidated-framework');
      expect(response.result.data.id).to.exist;

      const certificationVersion = await knex('certification_versions')
        .where({ scope: complementaryCertification.key })
        .orderBy('startDate', 'desc')
        .first();

      expect(certificationVersion).to.exist;
      expect(certificationVersion.scope).to.equal(complementaryCertification.key);
      expect(certificationVersion.expirationDate).to.be.null;
      expect(certificationVersion.assessmentDuration).to.equal(DEFAULT_SESSION_DURATION_MINUTES);
      expect(certificationVersion.challengesConfiguration).to.deep.equal({});
      expect(certificationVersion.startDate).to.exist;

      const consolidatedFramework = await knex('certification-frameworks-challenges')
        .select('discriminant', 'difficulty', 'challengeId', 'complementaryCertificationKey', 'versionId')
        .where({
          complementaryCertificationKey: complementaryCertification.key,
        });
      expect(consolidatedFramework).to.deep.equal([
        {
          discriminant: null,
          difficulty: null,
          challengeId: challenge.id,
          complementaryCertificationKey: complementaryCertification.key,
          versionId: certificationVersion.id,
        },
      ]);
    });

    it('should create a new version and expire the previous one when a version already exists', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();
      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();

      const existingVersionStartDate = new Date('2024-01-01');
      const existingVersion = databaseBuilder.factory.buildCertificationVersion({
        scope: complementaryCertification.key,
        startDate: existingVersionStartDate,
        expirationDate: null,
        assessmentDuration: DEFAULT_SESSION_DURATION_MINUTES,
      });

      const tubeId = 'myTubeId';
      const skill = databaseBuilder.factory.learningContent.buildSkill({
        tubeId,
        status: 'actif',
      });
      const tube1 = databaseBuilder.factory.learningContent.buildTube({ id: tubeId, skillIds: [skill.id] });
      const challenge = databaseBuilder.factory.learningContent.buildChallenge({
        skillId: skill.id,
        status: 'validé',
        locales: ['fr-fr'],
      });

      await databaseBuilder.commit();

      const options = {
        method: 'POST',
        url: `/api/admin/complementary-certifications/${complementaryCertification.key}/consolidated-framework`,
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        payload: {
          data: {
            attributes: {
              tubeIds: [tube1.id],
            },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(201);

      const versions = await knex('certification_versions')
        .where({ scope: complementaryCertification.key })
        .orderBy('startDate', 'asc');

      expect(versions).to.have.lengthOf(2);

      const [oldVersion, newVersion] = versions;

      expect(oldVersion.id).to.equal(existingVersion.id);
      expect(oldVersion.expirationDate).to.exist;
      expect(oldVersion.expirationDate).to.be.instanceOf(Date);

      expect(newVersion.expirationDate).to.be.null;
      expect(newVersion.startDate).to.exist;
      expect(newVersion.startDate).to.be.instanceOf(Date);
      expect(newVersion.startDate.getTime()).to.equal(oldVersion.expirationDate.getTime());

      const consolidatedFramework = await knex('certification-frameworks-challenges')
        .select('challengeId', 'complementaryCertificationKey', 'versionId')
        .where({
          complementaryCertificationKey: complementaryCertification.key,
          versionId: newVersion.id,
        });

      expect(consolidatedFramework).to.deep.equal([
        {
          challengeId: challenge.id,
          complementaryCertificationKey: complementaryCertification.key,
          versionId: newVersion.id,
        },
      ]);
    });
  });

  describe('PATCH /api/admin/complementary-certifications/{complementaryCertificationKey}/consolidated-framework', function () {
    it('should return 200 HTTP status code and update framework with calibration', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();

      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();
      const certificationVersion = databaseBuilder.factory.buildCertificationVersion({
        scope: complementaryCertification.key,
      });
      const certificationFrameworkChallenge = databaseBuilder.factory.buildCertificationFrameworksChallenge({
        challengeId: 'recChallengeId',
        complementaryCertificationKey: complementaryCertification.key,
        version: '20230618000000',
        versionId: certificationVersion.id,
      });

      await databaseBuilder.commit();

      const calibration = datamartBuilder.factory.buildCalibration({
        scope: 'DROIT',
        status: 'VALIDATED',
      });
      const otherCalibration = datamartBuilder.factory.buildCalibration({
        scope: 'DROIT',
        status: 'VALIDATED',
      });
      const activeCalibratedChallenge = datamartBuilder.factory.buildDatamartActiveCalibratedChallenge({
        calibrationId: calibration.id,
        challengeId: 'recChallengeId',
        alpha: 3.3,
        delta: 4.4,
      });
      datamartBuilder.factory.buildDatamartActiveCalibratedChallenge({
        calibrationId: otherCalibration.id,
        challengeId: 'recChallengeId',
        alpha: 3.1,
        delta: 6.4,
      });
      await datamartBuilder.commit();

      const options = {
        method: 'PATCH',
        url: '/api/admin/complementary-certifications/consolidated-framework',
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
        payload: {
          data: {
            attributes: {
              versionId: certificationVersion.id,
              calibrationId: calibration.id,
            },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);

      const certificationFrameworksChallenges = await knex('certification-frameworks-challenges').where({
        versionId: certificationVersion.id,
      });
      expect(certificationFrameworksChallenges).to.have.length(1);
      expect(_.omit(certificationFrameworksChallenges[0], 'id', 'createdAt')).to.deep.equal({
        calibrationId: null,
        discriminant: activeCalibratedChallenge.alpha,
        difficulty: activeCalibratedChallenge.delta,
        challengeId: certificationFrameworkChallenge.challengeId,
        complementaryCertificationKey: complementaryCertification.key,
        version: '20230618000000',
        versionId: certificationVersion.id,
      });
    });
  });

  describe('GET /api/admin/complementary-certifications/{complementaryCertificationKey}/current-consolidated-framework', function () {
    it('should return the current consolidated framework for given complementaryCertificationKey', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();

      const minimalLearningContent = [
        {
          id: 'recArea0',
          competences: [
            {
              id: 'recNv8qhaY887jQb2',
              thematics: [
                {
                  id: 'recThemCompetence1',
                  tubes: [
                    { id: 'recTubeCompetence1', skills: [{ id: 'skillId@web3', challenges: [{ id: 'rec123' }] }] },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const learningContentObjects = learningContentBuilder.fromAreas(minimalLearningContent);
      await mockLearningContent(learningContentObjects);

      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();
      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        challengeId: 'rec123',
        discriminant: 2.1,
        difficulty: 3.4,
        createdAt: new Date('2023-01-11'),
      });

      await databaseBuilder.commit();

      const options = {
        method: 'GET',
        url: `/api/admin/complementary-certifications/${complementaryCertification.key}/current-consolidated-framework`,
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data).to.deep.equal({
        id: ComplementaryCertificationKeys.PIX_PLUS_DROIT,
        type: 'certification-consolidated-frameworks',
        attributes: {
          'complementary-certification-key': complementaryCertification.key,
          version: '20230111000000',
        },
        relationships: {
          areas: {
            data: [
              {
                id: 'recArea0',
                type: 'areas',
              },
            ],
          },
        },
      });
      expect(response.result.included).to.deep.equal([
        {
          attributes: {
            difficulty: 2,
          },
          id: 'skillId@web3',
          type: 'skills',
        },
        {
          attributes: {
            name: 'name Tube A',
            'practical-title': 'practicalTitle FR Tube A',
          },
          id: 'recTubeCompetence1',
          relationships: {
            skills: {
              data: [
                {
                  id: 'skillId@web3',
                  type: 'skills',
                },
              ],
            },
          },
          type: 'tubes',
        },
        {
          attributes: {
            index: 8,
            name: 'name FR Thématique A',
          },
          id: 'recThemCompetence1',
          relationships: {
            tubes: {
              data: [
                {
                  id: 'recTubeCompetence1',
                  type: 'tubes',
                },
              ],
            },
          },
          type: 'thematics',
        },
        {
          attributes: {
            index: 'index Compétence A',
            name: 'name FR Compétence A',
          },
          id: 'recNv8qhaY887jQb2',
          relationships: {
            thematics: {
              data: [
                {
                  id: 'recThemCompetence1',
                  type: 'thematics',
                },
              ],
            },
          },
          type: 'competences',
        },
        {
          attributes: {
            code: 'code Domaine A',
            color: 'color Domaine A',
            'framework-id': 'undefined',
            title: 'title FR Domaine A',
          },
          id: 'recArea0',
          relationships: {
            competences: {
              data: [
                {
                  id: 'recNv8qhaY887jQb2',
                  type: 'competences',
                },
              ],
            },
          },
          type: 'areas',
        },
      ]);
    });
  });

  describe('GET /api/admin/complementary-certifications/{complementaryCertificationKey}/framework-history', function () {
    it('should return the framework history for given complementaryCertificationKey', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();

      const complementaryCertification = databaseBuilder.factory.buildComplementaryCertification();
      const otherComplementaryCertification = databaseBuilder.factory.buildComplementaryCertification.clea({});

      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        challengeId: 'rec123',
        createdAt: new Date('2024-01-11'),
      });

      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: complementaryCertification.key,
        challengeId: 'rec123',
        createdAt: new Date('2025-01-11'),
      });

      databaseBuilder.factory.buildCertificationFrameworksChallenge({
        complementaryCertificationKey: otherComplementaryCertification.key,
        challengeId: 'rec123',
        createdAt: new Date('2023-01-11'),
      });

      await databaseBuilder.commit();

      const options = {
        method: 'GET',
        url: `/api/admin/complementary-certifications/${complementaryCertification.key}/framework-history`,
        headers: generateAuthenticatedUserRequestHeaders({ userId: superAdmin.id }),
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data).to.deep.equal({
        id: complementaryCertification.key,
        type: 'framework-histories',
        attributes: {
          'complementary-certification-key': complementaryCertification.key,
          history: ['20250111000000', '20240111000000'],
        },
      });
    });
  });
});
