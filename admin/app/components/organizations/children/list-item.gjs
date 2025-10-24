import PixTableColumn from '@1024pix/pix-ui/components/pix-table-column';
import { LinkTo } from '@ember/routing';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';

import ActionsOnChildrenInOrganization from './actions-on-children-in-organization';

export default class ListItem extends Component {
  @service accessControl;
  <template>
    <PixTableColumn @context={{@context}}>
      <:header>
        {{t "components.organizations.children-list.table-headers.id"}}
      </:header>
      <:cell>
        <LinkTo @route="authenticated.organizations.get" @model={{@organization.id}}>
          {{@organization.id}}
        </LinkTo>
      </:cell>
    </PixTableColumn>
    <PixTableColumn @context={{@context}} class="break-word">
      <:header>
        {{t "components.organizations.children-list.table-headers.name"}}
      </:header>
      <:cell>
        {{@organization.name}}
      </:cell>
    </PixTableColumn>
    <PixTableColumn @context={{@context}} class="break-word">
      <:header>
        {{t "components.organizations.children-list.table-headers.external-id"}}
      </:header>
      <:cell>
        {{@organization.externalId}}
      </:cell>
    </PixTableColumn>

    {{#if this.accessControl.hasAccessToDetachChildOrganizationScope}}
      <PixTableColumn
        @context={{@context}}
        class="break-word"
        aria-label={{t "components.organizations.children-list.table-headers.actions"}}
      >
        <:header>
          {{t "components.organizations.children-list.table-headers.actions"}}
        </:header>
        <:cell>
          <ActionsOnChildrenInOrganization
            @organization={{@organization}}
            @onDetachChildOrganization={{@onDetachChildOrganization}}
          />
        </:cell>
      </PixTableColumn>
    {{/if}}
  </template>
}
