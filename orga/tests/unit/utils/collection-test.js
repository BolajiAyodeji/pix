import { setupTest } from 'ember-qunit';
import { sum, sumBy } from 'pix-orga/utils/collection';
import { module, test } from 'qunit';

module('Unit | Utils | collection', function (hooks) {
  setupTest(hooks);
  module('sum', function () {
    test('it correctly sums an array of numbers', function (assert) {
      const numbers = [1, 2, 3, 4, 5];
      const result = sum(numbers);
      assert.strictEqual(result, 15, 'Sum of [1, 2, 3, 4, 5] should be 15');
    });

    test('it returns 0 for an empty array', function (assert) {
      const numbers = [];
      const result = sum(numbers);
      assert.strictEqual(result, 0, 'Sum of an empty array should be 0');
    });
  });

  module('sumBy', function () {
    test('it correctly sums a property of an array of objects', function (assert) {
      const items = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];
      const result = sumBy(items, 'value');
      assert.strictEqual(result, 15, 'Sum of values should be 15');
    });

    test('it returns 0 for an empty array', function (assert) {
      const items = [];
      const result = sumBy(items, 'value');
      assert.strictEqual(result, 0, 'Sum of an empty array should be 0');
    });
  });
});
