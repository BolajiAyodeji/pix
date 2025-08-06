import { ModuleInstantiationError } from '../../../../../../src/devcomp/domain/errors.js';
import { Module } from '../../../../../../src/devcomp/domain/models/module/Module.js';
import { DomainError } from '../../../../../../src/shared/domain/errors.js';
import { catchErrSync, expect } from '../../../../../test-helper.js';

describe('Unit | Devcomp | Domain | Models | Module | Module', function () {
  describe('#constructor', function () {
    it('should create a module and keep attributes', function () {
      // given
      const id = 1;
      const slug = 'les-adresses-email';
      const title = 'Les adresses email';
      const isBeta = false;
      const grains = [Symbol('text')];
      const details = Symbol('details');
      const version = Symbol('version');

      // when
      const module = new Module({ id, slug, title, isBeta, grains, details, version });

      // then
      expect(module.id).to.equal(id);
      expect(module.slug).to.equal(slug);
      expect(module.title).to.equal(title);
      expect(module.isBeta).to.equal(isBeta);
      expect(module.grains).to.have.lengthOf(grains.length);
      expect(module.details).to.deep.equal(details);
      expect(module.version).to.deep.equal(version);
    });

    describe('if a module does not have an id', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(() => new Module({}))();

        // then
        expect(error).to.be.instanceOf(DomainError);
        expect(error.message).to.equal('The id is required for a module');
      });
    });

    describe('if a module does not have a slug', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(() => new Module({ id: 1 }))();

        // then
        expect(error).to.be.instanceOf(DomainError);
        expect(error.message).to.equal('The slug is required for a module');
      });
    });

    describe('if a module does not have a title', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(() => new Module({ id: 1, slug: 'my-slug' }))();

        // then
        expect(error).to.be.instanceOf(DomainError);
        expect(error.message).to.equal('The title is required for a module');
      });
    });

    describe('if a module does not have isBeta value', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(
          () =>
            new Module({
              id: 'id_module_1',
              slug: 'bien-ecrire-son-adresse-mail',
              title: 'Bien écrire son adresse mail',
            }),
        )();

        // then
        expect(error).to.be.instanceOf(DomainError);
        expect(error.message).to.equal('isBeta value is required for a module');
      });
    });

    describe('if a module does not have grains', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(
          () =>
            new Module({
              id: 'id_module_1',
              slug: 'bien-ecrire-son-adresse-mail',
              title: 'Bien écrire son adresse mail',
              isBeta: true,
            }),
        )();

        // then
        expect(error).to.be.instanceOf(DomainError);
        expect(error.message).to.equal('A list of grains is required for a module');
      });
    });

    describe('if a module has grains with the wrong type', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(
          () =>
            new Module({
              id: 'id_module_1',
              slug: 'bien-ecrire-son-adresse-mail',
              title: 'Bien écrire son adresse mail',
              isBeta: true,
              grains: 'elements',
            }),
        )();

        // then
        expect(error).to.be.instanceOf(ModuleInstantiationError);
        expect(error.message).to.equal(`A module should have a list of grains`);
      });
    });

    describe('if a module does not have details', function () {
      it('should throw an error', function () {
        // when
        const error = catchErrSync(
          () =>
            new Module({
              id: 'id_module_1',
              slug: 'bien-ecrire-son-adresse-mail',
              title: 'Bien écrire son adresse mail',
              isBeta: true,
              grains: [],
            }),
        )();

        // then
        expect(error).to.be.instanceOf(DomainError);
        expect(error.message).to.equal('The details are required for a module');
      });
    });
  });

  describe('#setRedirectionUrl', function () {
    let module;

    beforeEach(function () {
      const id = 1;
      const slug = 'les-adresses-email';
      const title = 'Les adresses email';
      const isBeta = false;
      const grains = [Symbol('text')];
      const details = Symbol('details');
      const version = Symbol('version');

      module = new Module({ id, slug, title, isBeta, grains, details, version });
    });
    it('should set redirectionUrl when url is valid', function () {
      // given
      const url = 'https://app.pix.fr/parcours/COMBINIX1';

      // when
      module.setRedirectionUrl(url);

      // then
      expect(module.redirectionUrl).to.equal(url);
    });
    it('should not set redirectionUrl when url is invalid', function () {
      // given
      const url = 'wrong';

      // when
      module.setRedirectionUrl(url);

      // then
      expect(module.redirectionUrl).to.be.undefined;
    });
  });
});
