import PixFilterBanner from '@1024pix/pix-ui/components/pix-filter-banner';
import PixPagination from '@1024pix/pix-ui/components/pix-pagination';
import PixSelect from '@1024pix/pix-ui/components/pix-select';
import PixTable from '@1024pix/pix-ui/components/pix-table';
import PixTableColumn from '@1024pix/pix-ui/components/pix-table-column';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';
import { eq } from 'ember-truth-helpers';
import EmptyState from 'pix-orga/components/campaign/empty-state';
import ParticipationStatus from 'pix-orga/components/ui/participation-status';

export default class CombinedCourse extends Component {
  @service intl;
  @service locale;
  @service currentUser;

  get statusOptions() {
    return ['STARTED', 'COMPLETED'];
  }

  @action
  onSelectStatus(status) {
    this.args.onFilter('status', status);
  }

  <template>
    {{#if @participations.length}}
      <!-- filter banner-->
      <!-- TODO: write tests on this part -->
      <PixFilterBanner @onClearFilters={{@onFilter "statuses"}}>
        <PixSelect
          @screenReaderOnly={{true}}
          @options={{this.statusOptions}}
          @onChange={{this.onSelectStatus}}
          @value={{@selectedStatus}}
          @hideDefaultOption={{false}}
        >
          <:label></:label>
        </PixSelect>
      </PixFilterBanner>
      <!-- end of filter banner-->

      <PixTable
        @variant="orga"
        @caption={{t "pages.combined-course.table.description"}}
        @data={{@participations}}
        class="table"
      >
        <:columns as |participation context|>
          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.combined-course.table.column.last-name"}}
            </:header>
            <:cell>
              {{participation.lastName}}
            </:cell>
          </PixTableColumn>

          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.combined-course.table.column.first-name"}}
            </:header>
            <:cell>
              {{participation.firstName}}
            </:cell>
          </PixTableColumn>

          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.combined-course.table.column.status"}}
            </:header>
            <:cell>
              <ParticipationStatus @status={{participation.status}} />
            </:cell>
          </PixTableColumn>
          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.combined-course.table.column.campaigns"}}
            </:header>
            <:cell>
              <CompletionDisplay
                @type="campaign"
                @nbItems={{participation.nbCampaigns}}
                @nbItemsCompleted={{participation.nbCampaignsCompleted}}
              />
            </:cell>
          </PixTableColumn>
          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.combined-course.table.column.modules"}}
            </:header>
            <:cell>
              <CompletionDisplay
                @type="module"
                @nbItems={{participation.nbModules}}
                @nbItemsCompleted={{participation.nbModulesCompleted}}
              />
            </:cell>
          </PixTableColumn>
        </:columns>
      </PixTable>
      {{#if @participations.meta}}
        <PixPagination @pagination={{@participations.meta}} @locale={{this.locale.currentLanguage}} />
      {{/if}}
    {{else}}
      <EmptyState />
    {{/if}}
  </template>
}

const CompletionDisplay = <template>
  {{#if @nbItems}}
    <span aria-hidden="true">{{@nbItemsCompleted}}/{{@nbItems}}</span>
    {{#if (eq @type "campaign")}}
      <span class="screen-reader-only">{{t
          "pages.combined-course.table.campaign-completion"
          count=@nbItemsCompleted
          nbCampaigns=@nbItems
        }}
      </span>
    {{else}}
      <span class="screen-reader-only">{{t
          "pages.combined-course.table.module-completion"
          count=@nbItemsCompleted
          nbModules=@nbItems
        }}
      </span>
    {{/if}}
  {{else}}
    <span aria-hidden="true">-</span>
    <span class="screen-reader-only">{{t "pages.combined-course.table.no-module"}}</span>
  {{/if}}
</template>;
