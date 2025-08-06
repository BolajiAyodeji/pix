import { config } from '../../../../../src/shared/config.js';
import { cryptoService } from '../../../../../src/shared/domain/services/crypto-service.js';
import { createServer, expect } from '../../../../test-helper.js';

describe('Acceptance | Controller | modules-controller-getBySlug', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
  });

  describe('GET /api/modules/:slug', function () {
    context('when module exists', function () {
      it('should return module', async function () {
        const options = {
          method: 'GET',
          url: `/api/modules/bien-ecrire-son-adresse-mail`,
        };

        const response = await server.inject(options);

        expect(response.statusCode).to.equal(200);
        expect(response.result.data.type).to.equal('modules');
      });

      it('should return module with redirectionUrl', async function () {
        const expectedUrl = 'https://app.pix.fr/parcours/COMBINIX1';
        const redirectionHash = await cryptoService.encrypt(expectedUrl, config.module.secret);
        const options = {
          method: 'GET',
          url: `/api/modules/bien-ecrire-son-adresse-mail?redirectionHash=${encodeURIComponent(redirectionHash)}`,
        };

        const response = await server.inject(options);

        expect(response.statusCode).to.equal(200);
        expect(response.result.data.attributes['redirection-url']).to.equal(expectedUrl);
      });
    });

    context('when module does not exist', function () {
      it('should return 404', async function () {
        const options = {
          method: 'GET',
          url: `/api/modules/dresser-des-pokemons`,
        };

        const response = await server.inject(options);

        expect(response.statusCode).to.equal(404);
      });
    });
  });
});
