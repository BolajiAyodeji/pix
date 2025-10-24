import { module, test } from 'qunit';

// import sinon from 'sinon';
import setupIntlRenderingTest from '../../../../helpers/setup-intl-rendering';

module('Unit | Controller | authenticated/combined-course/participations', function (hooks) {
  setupIntlRenderingTest(hooks);
  let controller;

  hooks.beforeEach(function () {
    controller = this.owner.lookup('controller:authenticated/combined-course/participations');
  });

  module('#action triggerFiltering', function () {
    module('when the filters contain defined values', function () {
      test('update value', async function (assert) {
        // given
        controller.fullName = 'nom1';
        controller.statuses = [];

        // when
        controller.triggerFiltering('fullName', 'nom2');
        controller.triggerFiltering('statuses', ['STARTED']);

        // then
        assert.strictEqual(controller.fullName, 'nom2');
        assert.strictEqual(controller.statuses, ['STARTED']);
      });
    });
  });
});
