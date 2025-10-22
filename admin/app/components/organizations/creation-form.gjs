import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixInput from '@1024pix/pix-ui/components/pix-input';
import PixSelect from '@1024pix/pix-ui/components/pix-select';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { t } from 'ember-intl';

import Card from '../card';

export default class OrganizationCreationForm extends Component {
  @service store;

  @tracked administrationTeams = [];

  organizationTypes = [
    { value: 'PRO', label: 'Organisation professionnelle' },
    { value: 'SCO', label: 'Établissement scolaire' },
    { value: 'SUP', label: 'Établissement supérieur' },
    { value: 'SCO-1D', label: 'Établissement scolaire du premier degré' },
  ];

  constructor() {
    super(...arguments);
    this.#onMount();
  }

  async #onMount() {
    this.administrationTeams = await this.store.findAll('administration-team');
  }

  get administrationTeamsOptions() {
    const options = this.administrationTeams.map((administrationTeam) => ({
      value: administrationTeam.id,
      label: administrationTeam.name,
    }));
    return options;
  }

  @action
  handleOrganizationTypeSelectionChange(value) {
    this.args.organization.type = value;
  }

  @action
  handleOrganizationNameChange(event) {
    this.args.organization.name = event.target.value;
  }

  @action
  handleAdministrationTeamSelectionChange(value) {
    this.args.organization.administrationTeamId = value;
  }

  @action
  handleDocumentationUrlChange(event) {
    this.args.organization.documentationUrl = event.target.value;
  }

  @action
  handleCreditsChange(event) {
    this.args.organization.credit = +event.target.value;
  }

  @action
  handleDataProtectionOfficerFirstNameChange(event) {
    this.args.organization.dataProtectionOfficerFirstName = event.target.value;
  }

  @action
  handleDataProtectionOfficerLastNameChange(event) {
    this.args.organization.dataProtectionOfficerLastName = event.target.value;
  }

  @action
  handleDataProtectionOfficerEmailChange(event) {
    this.args.organization.dataProtectionOfficerEmail = event.target.value;
  }

  <template>
    <form class="admin-form" {{on "submit" @onSubmit}}>
      <section class="admin-form__content admin-form__content--with-counters">
        <Card class="admin-form__card" @title="Information générique">
          {{#if @parentOrganizationName}}
            <h2 class="admin-form__content title">
              {{t
                "components.organizations.creation.parent-organization-name"
                parentOrganizationName=@parentOrganizationName
              }}
            </h2>
          {{/if}}
          <PixInput
            @id="organizationName"
            onchange={{this.handleOrganizationNameChange}}
            required={{true}}
            aria-required={{true}}
            @requiredLabel={{t "common.fields.required-field"}}
          >
            <:label>Nom</:label>
          </PixInput>

          <PixSelect
            @onChange={{this.handleOrganizationTypeSelectionChange}}
            @options={{this.organizationTypes}}
            @placeholder="Type d'organisation"
            @hideDefaultOption={{true}}
            @value={{@organization.type}}
            required
            aria-required={{true}}
            @requiredLabel={{t "common.fields.required-field"}}
          >
            <:label>Sélectionner un type d'organisation</:label>
            <:default as |organizationType|>{{organizationType.label}}</:default>
          </PixSelect>

          <PixSelect
            @onChange={{this.handleAdministrationTeamSelectionChange}}
            @options={{this.administrationTeamsOptions}}
            @placeholder={{t "components.organizations.creation.administration-team.selector.placeholder"}}
            @hideDefaultOption={{true}}
            @value={{@organization.administrationTeamId}}
            required
            aria-required={{true}}
            @requiredLabel={{t "common.fields.required-field"}}
          >
            <:label>{{t "components.organizations.creation.administration-team.selector.label"}}</:label>
          </PixSelect>
        </Card>

        <Card class="admin-form__card" @title="Configuration">
          <PixInput @id="documentationUrl" onchange={{this.handleDocumentationUrlChange}}>
            <:label>Lien vers la documentation</:label>
          </PixInput>
          <PixInput @id="credits" onchange={{this.handleCreditsChange}} type="number">
            <:label>Crédits</:label>
          </PixInput>
        </Card>

        <Card class="admin-form__card" @title="Data Privacy Officer">
          <PixInput @id="dataProtectionOfficerFirstName" onchange={{this.handleDataProtectionOfficerFirstNameChange}}>
            <:label>Prénom du DPO</:label>
          </PixInput>
          <PixInput @id="dataProtectionOfficerLastName" onchange={{this.handleDataProtectionOfficerLastNameChange}}>
            <:label>Nom du DPO</:label>
          </PixInput>
          <PixInput @id="dataProtectionOfficerEmail" onchange={{this.handleDataProtectionOfficerEmailChange}}>
            <:label>Adresse e-mail du DPO</:label>
          </PixInput>
        </Card>
      </section>

      <section class="admin-form__actions">
        <PixButton @size="small" @variant="secondary" @triggerAction={{@onCancel}}>
          {{t "common.actions.cancel"}}
        </PixButton>

        {{#if @parentOrganizationName}}
          <PixButton @type="submit" @size="small" @variant="success">
            {{t "components.organizations.creation.actions.add-child-organization"}}
          </PixButton>
        {{else}}
          <PixButton @type="submit" @size="small" @variant="success">
            {{t "common.actions.add"}}
          </PixButton>
        {{/if}}
      </section>
    </form>
  </template>
}
