import {
  createServer,
  databaseBuilder,
  expect,
  generateAuthenticatedUserRequestHeaders,
  knex,
} from '../../../../test-helper.js';

describe('Acceptance | Controller | Certification | Session management | session-for-supervising-controller-supervise', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
  });

  it('should return a HTTP 204 No Content', async function () {
    // given
    const certificationCenter = databaseBuilder.factory.buildCertificationCenter({});
    const session = databaseBuilder.factory.buildSession({
      certificationCenterId: certificationCenter.id,
    });
    const { id: userId } = databaseBuilder.factory.buildUser();
    await databaseBuilder.commit();

    const headers = generateAuthenticatedUserRequestHeaders({ userId });

    const options = {
      headers,
      method: 'POST',
      url: '/api/sessions/supervise',
      payload: {
        data: {
          id: session.id,
          type: 'supervisor-authentications',
          attributes: {
            'session-id': session.id,
            'supervisor-password': session.invigilatorPassword,
          },
        },
      },
    };

    // when
    const response = await server.inject(options);

    // then
    const supervisedSessionInDB = await knex('supervisor-accesses').where({ userId, sessionId: session.id }).first();
    expect(supervisedSessionInDB).to.exist;
    expect(response.statusCode).to.equal(204);
  });
});
