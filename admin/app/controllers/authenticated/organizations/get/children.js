import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import get from 'lodash/get';

export default class AuthenticatedOrganizationsGetChildrenController extends Controller {
  @service accessControl;
  @service intl;
  @service pixToast;
  @service store;

  @action
  async handleFormSubmitted(childOrganizationIds) {
    const organizationAdapter = this.store.adapterFor('organization');
    const parentOrganizationId = this.model.organization.id;

    try {
      await organizationAdapter.attachChildOrganization({ childOrganizationIds, parentOrganizationId });

      const count = childOrganizationIds.split(',').length;
      this.pixToast.sendSuccessNotification({
        message: this.intl.t('pages.organization-children.notifications.success.attach-child-organization', {
          count,
        }),
      });

      await this.model.organization.hasMany('children').reload();
    } catch (responseError) {
      const error = get(responseError, 'errors[0]');
      const { childOrganizationId } = error.meta;
      let message;
      switch (error?.code) {
        case 'UNABLE_TO_ATTACH_CHILD_ORGANIZATION_TO_ITSELF':
          message = this.intl.t(
            'pages.organization-children.notifications.error.unable-to-attach-child-organization-to-itself',
            { childOrganizationId },
          );
          break;
        case 'UNABLE_TO_ATTACH_ALREADY_ATTACHED_CHILD_ORGANIZATION':
          message = this.intl.t(
            'pages.organization-children.notifications.error.unable-to-attach-already-attached-child-organization',
            { childOrganizationId },
          );
          break;
        case 'UNABLE_TO_ATTACH_CHILD_ORGANIZATION_TO_ANOTHER_CHILD_ORGANIZATION':
          message = this.intl.t(
            'pages.organization-children.notifications.error.unable-to-attach-child-organization-to-another-child-organization',
          );
          break;
        case 'UNABLE_TO_ATTACH_PARENT_ORGANIZATION_AS_CHILD_ORGANIZATION':
          message = this.intl.t(
            'pages.organization-children.notifications.error.unable-to-attach-parent-organization-as-child-organization',
            { childOrganizationId },
          );
          break;
        default:
          message = this.intl.t('common.notifications.generic-error');
      }

      this.pixToast.sendErrorNotification({ message });
    }
  }

  @action
  async detachChildOrganizationFromParent({ childOrganizationId }) {
    const organizationAdapter = this.store.adapterFor('organization');

    try {
      await organizationAdapter.detachChildOrganizationFromParent({ childOrganizationId });

      this.pixToast.sendSuccessNotification({
        message: this.intl.t('pages.organization-children.notifications.success.detach-child-organization'),
      });

      await this.model.organization.hasMany('children').reload();
    } catch (responseError) {
      const error = get(responseError, 'errors[0]');

      let errorMessage = this.intl.t('common.notifications.generic-error');

      if (error?.code === 'UNABLE_TO_DETACH_PARENT_ORGANIZATION_FROM_CHILD_ORGANIZATION') {
        errorMessage = this.intl.t(
          'pages.organization-children.notifications.error.unable-to-detach-child-organization',
        );
      }

      this.pixToast.sendErrorNotification({
        message: errorMessage,
      });
    }
  }
}
