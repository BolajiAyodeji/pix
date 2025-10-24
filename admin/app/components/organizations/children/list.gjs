import PixTable from '@1024pix/pix-ui/components/pix-table';
import { t } from 'ember-intl';

import ListItem from './list-item';

<template>
  <PixTable
    @variant="admin"
    @caption={{t "components.organizations.children-list.table-name"}}
    @data={{@organizations}}
  >
    <:columns as |organization context|>
      <ListItem
        @organization={{organization}}
        @context={{context}}
        @onDetachChildOrganization={{@onDetachChildOrganization}}
      />
    </:columns>
  </PixTable>
</template>
