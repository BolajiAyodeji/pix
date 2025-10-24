import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import sinon from 'sinon';

import setupIntl from '../../../../../helpers/setup-intl';

module('Unit | Controller | authenticated/organizations/get/children', function (hooks) {
  setupTest(hooks);
  setupIntl(hooks);

  let controller;
  let notifications;
  let store;

  hooks.beforeEach(function () {
    controller = this.owner.lookup('controller:authenticated/organizations/get/children');
    notifications = this.owner.lookup('service:pixToast');
    store = this.owner.lookup('service:store');

    this.intl = this.owner.lookup('service:intl');
  });

  module('#handleFormSubmitted', function () {
    test('attaches child organization to parent organization and displays success notification', async function (assert) {
      // given
      const childOrganizationIds = '1234, 5678';
      const organizationAdapter = { attachChildOrganization: sinon.stub().resolves() };

      sinon.stub(store, 'adapterFor').returns(organizationAdapter);
      sinon.stub(notifications, 'sendSuccessNotification');
      controller.model = {
        organization: store.createRecord('organization', { id: '12' }),
      };
      const reloadStub = sinon.stub();
      controller.model.organization.hasMany = sinon.stub();
      controller.model.organization.hasMany.returns({
        reload: reloadStub,
      });

      // when
      await controller.handleFormSubmitted(childOrganizationIds);

      // then
      assert.true(store.adapterFor.calledWithExactly('organization'));
      assert.true(
        organizationAdapter.attachChildOrganization.calledWithExactly({
          childOrganizationIds: '1234, 5678',
          parentOrganizationId: '12',
        }),
      );
      assert.true(
        notifications.sendSuccessNotification.calledWithExactly({
          message: this.intl.t('pages.organization-children.notifications.success.attach-child-organization', {
            count: 2,
          }),
        }),
      );
      assert.true(reloadStub.calledOnce);
    });

    module('when form submit fails', function (hooks) {
      let organizationAdapter;
      hooks.beforeEach(function () {
        organizationAdapter = {
          attachChildOrganization: sinon.stub(),
        };
        sinon.stub(store, 'adapterFor').returns(organizationAdapter);
        sinon.stub(notifications, 'sendErrorNotification');

        controller.model = {
          organization: store.createRecord('organization', { id: '12' }),
          organizations: { reload: sinon.stub().resolves() },
        };
      });

      test('calls notification service error for UNABLE_TO_ATTACH_CHILD_ORGANIZATION_TO_ITSELF error', async function (assert) {
        // given
        const childOrganizationId = '1234';
        organizationAdapter.attachChildOrganization.rejects({
          errors: [{ code: 'UNABLE_TO_ATTACH_CHILD_ORGANIZATION_TO_ITSELF', meta: { childOrganizationId } }],
        });

        // when
        await controller.handleFormSubmitted(childOrganizationId);

        // then
        assert.true(
          notifications.sendErrorNotification.calledWithExactly({
            message: this.intl.t(
              'pages.organization-children.notifications.error.unable-to-attach-child-organization-to-itself',
              { childOrganizationId },
            ),
          }),
        );
        assert.true(controller.model.organizations.reload.notCalled);
      });

      test('calls notification service error for UNABLE_TO_ATTACH_ALREADY_ATTACHED_CHILD_ORGANIZATION error', async function (assert) {
        // given
        const childOrganizationId = '1234';
        organizationAdapter.attachChildOrganization.rejects({
          errors: [{ code: 'UNABLE_TO_ATTACH_ALREADY_ATTACHED_CHILD_ORGANIZATION', meta: { childOrganizationId } }],
        });

        // when
        await controller.handleFormSubmitted(childOrganizationId);

        // then
        assert.true(
          notifications.sendErrorNotification.calledWithExactly({
            message: this.intl.t(
              'pages.organization-children.notifications.error.unable-to-attach-already-attached-child-organization',
              { childOrganizationId },
            ),
          }),
        );
        assert.true(controller.model.organizations.reload.notCalled);
      });

      test('calls notification service error for UNABLE_TO_ATTACH_CHILD_ORGANIZATION_TO_ANOTHER_CHILD_ORGANIZATION error', async function (assert) {
        // given
        const childOrganizationId = '1234';
        organizationAdapter.attachChildOrganization.rejects({
          errors: [
            {
              code: 'UNABLE_TO_ATTACH_CHILD_ORGANIZATION_TO_ANOTHER_CHILD_ORGANIZATION',
              meta: {},
            },
          ],
        });

        // when
        await controller.handleFormSubmitted(childOrganizationId);

        // then
        assert.true(
          notifications.sendErrorNotification.calledWithExactly({
            message: this.intl.t(
              'pages.organization-children.notifications.error.unable-to-attach-child-organization-to-another-child-organization',
            ),
          }),
        );
        assert.true(controller.model.organizations.reload.notCalled);
      });

      test('calls notification service error for UNABLE_TO_ATTACH_PARENT_ORGANIZATION_AS_CHILD_ORGANIZATION error', async function (assert) {
        // given
        const childOrganizationId = '1234';
        organizationAdapter.attachChildOrganization.rejects({
          errors: [
            { code: 'UNABLE_TO_ATTACH_PARENT_ORGANIZATION_AS_CHILD_ORGANIZATION', meta: { childOrganizationId } },
          ],
        });

        // when
        await controller.handleFormSubmitted(childOrganizationId);

        // then
        assert.true(
          notifications.sendErrorNotification.calledWithExactly({
            message: this.intl.t(
              'pages.organization-children.notifications.error.unable-to-attach-parent-organization-as-child-organization',
              { childOrganizationId },
            ),
          }),
        );
        assert.true(controller.model.organizations.reload.notCalled);
      });
    });
  });

  module('#detachChildOrganizationFromParent', function (hooks) {
    let childOrganizationId;
    let parentOrganization;
    let reloadStub;

    hooks.beforeEach(function () {
      childOrganizationId = '1234';
      parentOrganization = store.createRecord('organization', { id: '12' });

      controller.model = { organization: parentOrganization };

      reloadStub = sinon.stub();
      controller.model.organization.hasMany = sinon.stub().returns({ reload: reloadStub });
    });

    test('it should detach child organization from parent and display success notification', async function (assert) {
      // given
      const detachChildOrganizationFromParent = sinon.stub().resolves();

      const organizationAdapter = { detachChildOrganizationFromParent };

      sinon.stub(store, 'adapterFor').returns(organizationAdapter);

      sinon.stub(notifications, 'sendSuccessNotification');

      // when
      await controller.detachChildOrganizationFromParent({ childOrganizationId });

      // then
      assert.true(store.adapterFor.calledWithExactly('organization'));

      assert.true(organizationAdapter.detachChildOrganizationFromParent.calledWithExactly({ childOrganizationId }));

      assert.true(
        notifications.sendSuccessNotification.calledWithExactly({
          message: this.intl.t('pages.organization-children.notifications.success.detach-child-organization'),
        }),
      );

      assert.true(reloadStub.calledOnce);
    });

    module('when there is an error', function () {
      test('shoud display error notification for UNABLE_TO_DETACH_PARENT_ORGANIZATION_FROM_CHILD_ORGANIZATION error', async function (assert) {
        // given
        const detachChildOrganizationFromParent = sinon
          .stub()
          .rejects({ errors: [{ code: 'UNABLE_TO_DETACH_PARENT_ORGANIZATION_FROM_CHILD_ORGANIZATION' }] });

        const organizationAdapter = { detachChildOrganizationFromParent };

        sinon.stub(store, 'adapterFor').returns(organizationAdapter);

        sinon.stub(notifications, 'sendErrorNotification');

        // when
        await controller.detachChildOrganizationFromParent({ childOrganizationId });

        // then
        assert.true(store.adapterFor.calledWithExactly('organization'));

        assert.true(organizationAdapter.detachChildOrganizationFromParent.calledWithExactly({ childOrganizationId }));

        assert.true(
          notifications.sendErrorNotification.calledWithExactly({
            message: this.intl.t('pages.organization-children.notifications.error.unable-to-detach-child-organization'),
          }),
        );

        assert.true(reloadStub.notCalled);
      });

      test('shoud display generic error notification for any other error', async function (assert) {
        // given
        const detachChildOrganizationFromParent = sinon.stub().rejects({ errors: [{ code: 'ANY_CODE' }] });

        const organizationAdapter = { detachChildOrganizationFromParent };

        sinon.stub(store, 'adapterFor').returns(organizationAdapter);

        sinon.stub(notifications, 'sendErrorNotification');

        // when
        await controller.detachChildOrganizationFromParent({ childOrganizationId });

        // then
        assert.true(store.adapterFor.calledWithExactly('organization'));

        assert.true(organizationAdapter.detachChildOrganizationFromParent.calledWithExactly({ childOrganizationId }));

        assert.true(
          notifications.sendErrorNotification.calledWithExactly({
            message: this.intl.t('common.notifications.generic-error'),
          }),
        );

        assert.true(reloadStub.notCalled);
      });
    });
  });
});
