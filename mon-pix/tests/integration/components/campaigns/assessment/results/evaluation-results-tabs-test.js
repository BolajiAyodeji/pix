import { render } from '@1024pix/ember-testing-library';
import { click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { t } from 'ember-intl/test-support';
import { module, test } from 'qunit';
import sinon from 'sinon';

import setupIntlRenderingTest from '../../../../../helpers/setup-intl-rendering';

module('Integration | Components | Campaigns | Assessment | Results | Evaluation Results Tabs', function (hooks) {
  setupIntlRenderingTest(hooks);

  module('when there are rewards and trainings', function (hooks) {
    let screen;
    let onResultsSharedStub;

    hooks.beforeEach(async function () {
      // given
      const store = this.owner.lookup('service:store');

      const acquiredBadge = store.createRecord('badge', { isAcquired: true });
      this.set('campaignParticipationResult', {
        campaignParticipationBadges: [acquiredBadge],
        isShared: false,
      });

      const training = store.createRecord('training', { duration: { days: 2 } });
      this.set('trainings', [training]);

      onResultsSharedStub = sinon.stub();
      this.set('onResultsShared', onResultsSharedStub);

      // when
      screen = await render(
        hbs`<Campaigns::Assessment::Results::EvaluationResultsTabs
  @campaignParticipationResult={{this.campaignParticipationResult}}
  @trainings={{this.trainings}}
  @onResultsShared={{this.onResultsShared}}
  @isSharableCampaign={{true}}
/>`,
      );
    });

    test('it should display a tablist with three tabs', async function (assert) {
      // then
      assert.dom(screen.getByRole('tablist', { name: t('pages.skill-review.tabs.aria-label') })).exists();
      assert.strictEqual(screen.getAllByRole('tab').length, 3);
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.rewards.tab-label') }));
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.results-details.tab-label') }));
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.trainings.tab-label') }));
    });

    test('it should display the rewards tab first', async function (assert) {
      // then
      assert.dom(screen.getByRole('heading', { name: t('pages.skill-review.tabs.rewards.title') })).isVisible();
    });

    module('when clicking on shared results button', function () {
      test('it should call onResultsShared', async function (assert) {
        // given
        const store = this.owner.lookup('service:store');
        sinon.stub(store, 'adapterFor');
        const shareStub = sinon.stub();
        store.adapterFor.returns({ share: shareStub });

        // when
        await click(screen.queryByRole('tab', { name: 'Formations' }));
        await click(screen.queryByRole('button', { name: t('pages.skill-review.actions.send') }));

        // then
        assert.true(shareStub.calledOnce);
      });
    });
  });

  module('when there are rewards but no trainings', function () {
    test('it should not display the trainings tab', async function (assert) {
      // given
      const store = this.owner.lookup('service:store');
      const acquiredBadge = store.createRecord('badge', { isAcquired: true });

      this.set('campaignParticipationResult', {
        campaignParticipationBadges: [acquiredBadge],
        competenceResults: [],
      });

      this.set('trainings', []);

      // when
      const screen = await render(
        hbs`<Campaigns::Assessment::Results::EvaluationResultsTabs
  @campaignParticipationResult={{this.campaignParticipationResult}}
  @trainings={{this.trainings}}
/>`,
      );

      // then
      assert.dom(screen.getByRole('tablist', { name: t('pages.skill-review.tabs.aria-label') })).exists();
      assert.strictEqual(screen.getAllByRole('tab').length, 2);
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.rewards.tab-label') }));
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.results-details.tab-label') }));
      assert.notOk(screen.queryByRole('tab', { name: t('pages.skill-review.tabs.trainings.tab-label') }));
    });
  });

  module('when there are no rewards but trainings', function (hooks) {
    let screen;

    hooks.beforeEach(async function () {
      // given
      const store = this.owner.lookup('service:store');

      this.set('campaignParticipationResult', {
        campaignParticipationBadges: [],
        competenceResults: [],
      });

      const training = store.createRecord('training', { duration: { days: 2 } });
      this.set('trainings', [training]);

      // when
      screen = await render(
        hbs`<Campaigns::Assessment::Results::EvaluationResultsTabs
  @campaignParticipationResult={{this.campaignParticipationResult}}
  @trainings={{this.trainings}}
/>`,
      );
    });

    test('it should not display the rewards tab', async function (assert) {
      // then
      assert.dom(screen.getByRole('tablist', { name: t('pages.skill-review.tabs.aria-label') })).exists();
      assert.strictEqual(screen.getAllByRole('tab').length, 2);
      assert.notOk(screen.queryByRole('tab', { name: t('pages.skill-review.tabs.rewards.tab-label') }));
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.results-details.tab-label') }));
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.trainings.tab-label') }));
    });

    test('it should display the results details tab first', async function (assert) {
      // then
      assert.dom(screen.getByRole('heading', { name: t('pages.skill-review.tabs.results-details.title') })).isVisible();
    });
  });

  module('when there are no rewards and no trainings', function () {
    test('it should not display the tabs component', async function (assert) {
      // given
      this.set('trainings', []);

      this.set('campaignParticipationResult', {
        campaignParticipationBadges: [],
        competenceResults: [],
      });

      // when
      const screen = await render(
        hbs`<Campaigns::Assessment::Results::EvaluationResultsTabs
  @campaignParticipationResult={{this.campaignParticipationResult}}
  @trainings={{this.trainings}}
/>`,
      );

      // then
      assert.notOk(screen.queryByRole('tablist', { name: t('pages.skill-review.tabs.aria-label') }));
    });
  });
  module('when in a combined course context', function (hooks) {
    let screen;
    let onResultsSharedStub;

    hooks.beforeEach(async function () {
      // given
      const store = this.owner.lookup('service:store');
      this.set('campaignParticipationResult', {
        campaignParticipationBadges: [],
        isShared: false,
      });

      const training = store.createRecord('training', { duration: { days: 2 } });
      this.set('trainings', [training]);

      onResultsSharedStub = sinon.stub();
      this.set('onResultsShared', onResultsSharedStub);

      // when
      screen = await render(
        hbs`<Campaigns::Assessment::Results::EvaluationResultsTabs
  @campaignParticipationResult={{this.campaignParticipationResult}}
  @trainings={{this.trainings}}
  @onResultsShared={{this.onResultsShared}}
  @isSharableCampaign={{true}}
/>`,
      );
    });
    test('it should not display trainings', async function (assert) {
      // given
      this.set('trainings', []);

      this.set('campaignParticipationResult', {
        campaignParticipationBadges: [],
        competenceResults: [],
      });

      // when
      const screen = await render(
        hbs`<Campaigns::Assessment::Results::EvaluationResultsTabs
  @campaignParticipationResult={{this.campaignParticipationResult}}
  @trainings={{this.trainings}}
/>`,
      );

      // then
      assert.dom(screen.getByRole('tablist', { name: t('pages.skill-review.tabs.aria-label') })).exists();
      assert.strictEqual(screen.getAllByRole('tab').length, 2);
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.rewards.tab-label') }));
      assert.dom(screen.getByRole('tab', { name: t('pages.skill-review.tabs.results-details.tab-label') }));
      assert.notOk(screen.queryByRole('tab', { name: t('pages.skill-review.tabs.trainings.tab-label') }));
    });
  });
});
