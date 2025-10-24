import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixModal from '@1024pix/pix-ui/components/pix-modal';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { t } from 'ember-intl';

export default class ActionsOnChildrenInOrganization extends Component {
  @service store;

  @tracked displayConfirmModal = false;

  @action
  toggleDisplayConfirmModal() {
    this.displayConfirmModal = !this.displayConfirmModal;
  }

  @action
  async handleDetachChildOrganization() {
    await this.args.onDetachChildOrganization({ childOrganizationId: this.args.organization.id });
    this.displayConfirmModal = !this.displayConfirmModal;
  }

  <template>
    <PixButton @size="small" @variant="error" @triggerAction={{this.toggleDisplayConfirmModal}}>
      {{t "components.organizations.children-list.actions.detach.button"}}
    </PixButton>

    <PixModal
      @title={{t "components.organizations.children-list.actions.detach.confirm-modal-title"}}
      @onCloseButtonClick={{this.toggleDisplayConfirmModal}}
      @showModal={{this.displayConfirmModal}}
    >
      <:content>
        <p>
          {{t "components.organizations.children-list.actions.detach.confirm-modal-message"}}
        </p>
      </:content>
      <:footer>
        <PixButton @variant="secondary" @triggerAction={{this.toggleDisplayConfirmModal}}>
          {{t "common.actions.cancel"}}
        </PixButton>
        <PixButton @triggerAction={{this.handleDetachChildOrganization}}>{{t "common.actions.confirm"}}</PixButton>
      </:footer>
    </PixModal>
  </template>
}
