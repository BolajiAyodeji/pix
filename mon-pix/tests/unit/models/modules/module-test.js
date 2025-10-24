import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Unit | Model | Module | Module', function (hooks) {
  setupTest(hooks);

  test('Module model should exist with the right properties', function (assert) {
    // given
    const title = 'Bien écrire son adresse mail';
    const details = Symbol('details');
    const store = this.owner.lookup('service:store');
    const version = Symbol('version');
    const isBeta = Symbol('isBeta');
    const section = store.createRecord('section', {});

    // when
    const module = store.createRecord('module', { title, isBeta, details, version, sections: [section] });

    // then
    assert.ok(module);
    assert.strictEqual(module.title, title);
    assert.strictEqual(module.isBeta, isBeta);
    assert.strictEqual(module.details, details);
    assert.strictEqual(module.version, version);
    assert.strictEqual(module.sections[0], section);
  });

  module('#isNewPattern', function () {
    test('should return true when module has multiple sections', function (assert) {
      // given
      const title = 'Bien écrire son adresse mail';
      const details = Symbol('details');
      const store = this.owner.lookup('service:store');
      const version = Symbol('version');
      const isBeta = Symbol('isBeta');
      const section = store.createRecord('section', { type: 'question-yourself', grains: [] });
      const otherSection = store.createRecord('section', { type: 'go-further', grains: [] });

      // when
      const module = store.createRecord('module', {
        title,
        isBeta,
        details,
        version,
        sections: [section, otherSection],
      });

      // then
      assert.true(module.isNewPattern);
    });
    test('should return false when module has only one section', function (assert) {
      // given
      const title = 'Bien écrire son adresse mail';
      const details = Symbol('details');
      const store = this.owner.lookup('service:store');
      const version = Symbol('version');
      const isBeta = Symbol('isBeta');
      const section = store.createRecord('section', { type: 'blank', grains: [] });

      // when
      const module = store.createRecord('module', {
        title,
        isBeta,
        details,
        version,
        sections: [section],
      });

      // then
      assert.false(module.isNewPattern);
    });
  });
});
