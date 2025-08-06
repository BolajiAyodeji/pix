import { Module } from '../../../../../src/devcomp/domain/models/module/Module.js';
import { getModule } from '../../../../../src/devcomp/domain/usecases/get-module.js';
import { config } from '../../../../../src/shared/config.js';
import { cryptoService } from '../../../../../src/shared/domain/services/crypto-service.js';
import { expect, sinon } from '../../../../test-helper.js';

describe('Unit | Devcomp | Domain | UseCases | get-module', function () {
  describe('#getModule', function () {
    it('should get and return a Module', async function () {
      // given
      const expectedModule = Symbol('module');
      const slug = 'bien-ecrire-son-adresse-mail';
      const moduleRepository = {
        getBySlug: sinon.stub(),
      };
      moduleRepository.getBySlug.withArgs({ slug }).resolves(expectedModule);

      // when
      const module = await getModule({ slug, moduleRepository });

      // then
      expect(module).to.equal(expectedModule);
    });

    it('should get and return a Module with a redirection url', async function () {
      // given
      const id = 1;
      const slug = 'les-adresses-email';
      const title = 'Les adresses email';
      const isBeta = false;
      const grains = [Symbol('text')];
      const details = Symbol('details');
      const version = Symbol('version');

      const expectedModule = new Module({ id, slug, title, isBeta, grains, details, version });
      const moduleRepository = {
        getBySlug: sinon.stub(),
      };
      moduleRepository.getBySlug.withArgs({ slug }).resolves(expectedModule);
      const expectedUrl = 'https://app.pix.fr/parcours/COMBINIX1';
      const redirectionHash = await cryptoService.encrypt(expectedUrl, config.module.secret);

      // when
      const module = await getModule({ slug, redirectionHash, moduleRepository });

      // then
      expect(module.redirectionUrl).to.equal(expectedUrl);
    });
  });
});
