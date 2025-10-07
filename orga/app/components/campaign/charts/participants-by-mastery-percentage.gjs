import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { t } from 'ember-intl';
import { sumBy } from 'pix-orga/utils/collection';

import Chart from '../../ui/chart';
import ChartCard from '../../ui/chart-card';
import ParticipantsByMasteryPercentageLoader from './participants-by-mastery-percentage-loader';

export default class ParticipantsByMasteryPercentage extends Component {
  @service store;
  @service intl;

  @tracked data = [];
  @tracked accessibilityLabels = [];
  @tracked loading = true;

  constructor(...args) {
    super(...args);
    const { campaignId } = this.args;

    const adapter = this.store.adapterFor('campaign-stats');
    adapter.getParticipationsByMasteryRate(campaignId).then((response) => {
      const { steps, labels, accessibilityLabels } = this._buildChartDatas(
        response.data.attributes['result-distribution'],
      );
      this.max = Math.max(...steps);
      this.accessibilityLabels = accessibilityLabels;
      this.data = {
        labels,
        datasets: [
          {
            data: steps,
            border: getComputedStyle(document.body).getPropertyValue('--pix-primary-300'),
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--pix-primary-300'),
          },
        ],
      };

      this.loading = false;
    });
  }

  get options() {
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          min: 0,
          max: this.max,
          grid: {
            borderDash: [4, 4],
          },
          ticks: {
            stepSize: 1,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (tooltipItem) => {
              return this.intl.t('charts.participants-by-mastery-percentage.tooltip.title', {
                legend: tooltipItem[0].label,
              });
            },
            label: (data) => {
              return this.intl.t('charts.participants-by-mastery-percentage.tooltip.label', { count: data.raw });
            },
          },
        },
      },
    };
  }

  _buildChartDatas(resultDistributions) {
    const steps = [];
    const labels = [];
    const accessibilityLabels = [];

    for (let i = 10; i <= 100; i += 10) {
      const from = i === 10 ? 0 : (i - 9) / 100;
      const to = i / 100;
      labels.push(this.intl.t('charts.participants-by-mastery-percentage.tooltip.legend', { from, to }));
      const dataForStep = resultDistributions.filter(
        ({ masteryRate }) => Number(masteryRate) >= from && Number(masteryRate) <= to,
      );
      const count = sumBy(dataForStep, 'count');
      steps.push(count);
      accessibilityLabels.push(
        this.intl.t('charts.participants-by-mastery-percentage.label-a11y', { from, to, count }),
      );
    }

    return { steps, labels, accessibilityLabels };
  }

  <template>
    <ChartCard @title={{t "charts.participants-by-mastery-percentage.title"}} ...attributes>
      {{#if this.loading}}
        <ParticipantsByMasteryPercentageLoader />
      {{else}}
        <Chart
          @type="bar"
          @options={{this.options}}
          @data={{this.data}}
          aria-hidden="true"
          class="participants-by-mastery-percentage"
        />
      {{/if}}
    </ChartCard>
    <ul class="screen-reader-only">
      {{#each this.accessibilityLabels as |label|}}
        <li>{{label}}</li>
      {{/each}}
    </ul>
  </template>
}
