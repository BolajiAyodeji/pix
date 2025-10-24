import { render as renderScreen, within } from '@1024pix/ember-testing-library';
import { click } from '@ember/test-helpers';
import { t } from 'ember-intl/test-support';
import ActionsOnChildrenInOrganization from 'pix-admin/components/organizations/children/actions-on-children-in-organization';
import { module, test } from 'qunit';
import sinon from 'sinon';

import setupIntlRenderingTest from '../../../../helpers/setup-intl-rendering';
import { waitForDialogClose } from '../../../../helpers/wait-for';

module('Integration | Component | organizations/children/actions-on-children-in-organization', function (hooks) {
  setupIntlRenderingTest(hooks);
  let store;

  hooks.beforeEach(async function () {
    store = this.owner.lookup('service:store');
  });

  module('when clicking the Detach button', function () {
    test('it should display confirmation modal', async function (assert) {
      // given
      const organization = store.createRecord('organization', {
        id: 1,
        name: 'Orga 1',
      });

      // when
      const screen = await renderScreen(
        <template><ActionsOnChildrenInOrganization @organization={{organization}} /></template>,
      );

      await click(
        screen.getByRole('button', { name: t('components.organizations.children-list.actions.detach.button') }),
      );

      // then
      const modal = await screen.findByRole('dialog');
      assert.ok(
        within(modal).getByRole('heading', {
          name: t('components.organizations.children-list.actions.detach.confirm-modal-title'),
        }),
      );
    });

    module('When clicking Confirm', function () {
      test('it should call onDetachChildOrganization function and close modal', async function (assert) {
        // given
        const organization = store.createRecord('organization', {
          id: 1,
          name: 'Orga 1',
        });

        const onDetachChildOrganization = sinon.stub();

        // when
        const screen = await renderScreen(
          <template>
            <ActionsOnChildrenInOrganization
              @organization={{organization}}
              @onDetachChildOrganization={{onDetachChildOrganization}}
            />
          </template>,
        );

        await click(
          screen.getByRole('button', { name: t('components.organizations.children-list.actions.detach.button') }),
        );

        const modal = await screen.findByRole('dialog');

        await click(within(modal).getByRole('button', { name: t('common.actions.confirm') }));
        await waitForDialogClose();

        // then
        assert.ok(onDetachChildOrganization.calledOnceWithExactly({ childOrganizationId: organization.id }));

        assert.notOk(
          screen.queryByRole('dialog', {
            name: t('components.organizations.children-list.actions.detach.confirm-modal-title'),
          }),
        );
      });
    });

    module('When clicking Cancel', function () {
      test('it should NOT call function and close modal', async function (assert) {
        // given
        const organization = store.createRecord('organization', {
          id: 1,
          name: 'Orga 1',
        });

        const onDetachChildOrganization = sinon.stub();

        // when
        const screen = await renderScreen(
          <template>
            <ActionsOnChildrenInOrganization
              @organization={{organization}}
              @onDetachChildOrganization={{onDetachChildOrganization}}
            />
          </template>,
        );

        await click(
          screen.getByRole('button', { name: t('components.organizations.children-list.actions.detach.button') }),
        );

        const modal = await screen.findByRole('dialog');

        await click(within(modal).getByRole('button', { name: t('common.actions.cancel') }));
        await waitForDialogClose();

        // then
        assert.notOk(onDetachChildOrganization.called);
        assert.notOk(
          screen.queryByRole('dialog', {
            name: t('components.organizations.children-list.actions.detach.confirm-modal-title'),
          }),
        );
      });
    });
  });
});
