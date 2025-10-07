import { setupTest } from 'ember-qunit';
import { sum, sumBy } from 'pix-orga/utils/collection';
import { module, test } from 'qunit';

import { maxBy, minBy } from '../../../app/utils/collection';

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
  module('minBy', function () {
    test('it returns the object with the minimum value for a numeric property', function (assert) {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 5 },
        { id: 3, value: 8 },
      ];
      const result = minBy(items, 'value');
      assert.strictEqual(result, items[1], 'Should return the object with the minimum value');
    });

    test('it returns the object with the minimum value for a date property', function (assert) {
      const items = [
        { id: 1, date: new Date('2023-01-01') },
        { id: 2, date: new Date('2022-01-01') },
        { id: 3, date: new Date('2024-01-01') },
      ];
      const result = minBy(items, 'date');
      assert.strictEqual(result, items[1], 'Should return the object with the earliest date');
    });

    test('it returns null for an empty array', function (assert) {
      const items = [];
      const result = minBy(items, 'value');
      assert.strictEqual(result, null, 'Should return null for empty array');
    });

    test('it handles arrays with one item', function (assert) {
      const items = [{ id: 1, value: 10 }];
      const result = minBy(items, 'value');
      assert.strictEqual(result, items[0], 'Should return the single item');
    });
  });

  module('maxBy', function () {
    test('it returns the object with the maximum value for a numeric property', function (assert) {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 15 },
        { id: 3, value: 8 },
      ];
      const result = maxBy(items, 'value');
      assert.strictEqual(result, items[1], 'Should return the object with the maximum value');
    });

    test('it returns the object with the maximum value for a date property', function (assert) {
      const items = [
        { id: 1, date: new Date('2023-01-01') },
        { id: 2, date: new Date('2022-01-01') },
        { id: 3, date: new Date('2024-01-01') },
      ];
      const result = maxBy(items, 'date');
      assert.strictEqual(result, items[2], 'Should return the object with the latest date');
    });

    test('it returns null for an empty array', function (assert) {
      const items = [];
      const result = maxBy(items, 'value');
      assert.strictEqual(result, null, 'Should return null for empty array');
    });

    test('it handles arrays with one item', function (assert) {
      const items = [{ id: 1, value: 10 }];
      const result = maxBy(items, 'value');
      assert.strictEqual(result, items[0], 'Should return the single item');
    });
  });
});
