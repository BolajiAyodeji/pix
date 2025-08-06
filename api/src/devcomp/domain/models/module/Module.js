import { assertNotNullOrUndefined } from '../../../../shared/domain/models/asserts.js';
import { ModuleInstantiationError } from '../../errors.js';

class Module {
  constructor({ id, slug, title, isBeta, grains, details, version }) {
    assertNotNullOrUndefined(id, 'The id is required for a module');
    assertNotNullOrUndefined(slug, 'The slug is required for a module');
    assertNotNullOrUndefined(title, 'The title is required for a module');
    assertNotNullOrUndefined(isBeta, 'isBeta value is required for a module');
    assertNotNullOrUndefined(grains, 'A list of grains is required for a module');
    this.#assertGrainsIsAnArray(grains);
    assertNotNullOrUndefined(details, 'The details are required for a module');

    this.id = id;
    this.slug = slug;
    this.title = title;
    this.isBeta = isBeta;
    this.grains = grains;
    this.details = details;
    this.version = version;
  }

  #assertGrainsIsAnArray(grains) {
    if (!Array.isArray(grains)) {
      throw new ModuleInstantiationError('A module should have a list of grains');
    }
  }

  setRedirectionUrl(url) {
    const parsedUrl = URL.parse(url);
    if (parsedUrl) {
      this.redirectionUrl = parsedUrl.toString();
    }
  }
}

export { Module };
