import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import PixIndicatorCard from '@1024pix/pix-ui/components/pix-indicator-card';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';
import ActivityType from 'pix-orga/components/activity-type';
import CopyPasteButton from 'pix-orga/components/copy-paste-button';
import Breadcrumb from 'pix-orga/components/ui/breadcrumb';
import PageTitle from 'pix-orga/components/ui/page-title';

export default class CombinedCourseHeader extends Component {
  @service intl;

  get breadcrumbLinks() {
    return [
      {
        route: 'authenticated.campaigns.list.my-campaigns',
        label: this.intl.t('navigation.main.campaigns'),
      },
      {
        route: 'authenticated.campaigns.combined-courses',
        label: this.intl.t('navigation.main.combined-courses'),
      },
      {
        label: this.args.name,
      },
    ];
  }

  getCampaignIndex(index) {
    return index + 1;
  }

  <template>
    <PageTitle>
      <:breadcrumb>
        <Breadcrumb @links={{this.breadcrumbLinks}} class="campaign-header-title__breadcrumb" />
      </:breadcrumb>
      <:title>
        <ActivityType @big={{true}} @type="COMBINED_COURSE" @hideLabel={{true}} />
        <span class="page-title__name">{{@name}}</span>
      </:title>
      <:subtitle>
        <div class="combined-course-page__header">
          <p class="combined-course-page__header-body">{{t "pages.combined-course.introduction"}}</p>
          {{#if @campaignIds.length}}
            <div class="combined-course-page__campaigns">
              {{#each @campaignIds as |campaignId index|}}
                <PixButtonLink @route="authenticated.campaigns.campaign" @model={{campaignId}} @variant="primary">
                  {{t "pages.combined-course.campaigns" count=@campaignIds.length index=(this.getCampaignIndex index)}}
                </PixButtonLink>
              {{/each}}
            </div>
          {{/if}}
        </div>
      </:subtitle>
      <:tools>
        <dl class="campaign-header-title__details">

          <div class="campaign-header-title__detail-item">
            <dt class="label-text">
              {{t "pages.campaign.code"}}
            </dt>
            <dd class="campaign-header-title__campaign-code">
              <span>{{@code}}</span>
              <CopyPasteButton
                @clipBoardtext={{@code}}
                @successMessage={{t "pages.campaign.copy.code.success"}}
                @defaultMessage={{t "pages.campaign.copy.code.default"}}
                class="hide-on-mobile"
              />
            </dd>
          </div>
        </dl>
      </:tools>
    </PageTitle>
    <div class="combined-course-page__statistics">
      <PixIndicatorCard
        @title={{t "pages.combined-course.statistics.total-participations"}}
        @iconName="users"
        @color="purple"
      >
        <:default>{{@participationsCount}}</:default>
      </PixIndicatorCard>

      <PixIndicatorCard
        @title={{t "pages.combined-course.statistics.completed-participations"}}
        @iconName="inboxIn"
        @color="green"
      >
        <:default>{{@completedParticipationsCount}}</:default>
      </PixIndicatorCard>
    </div>
  </template>
}
