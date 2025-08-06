import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import { t } from 'ember-intl';
import ModuleObjectives from 'mon-pix/components/module/instruction/objectives';
import ModuleBetaBanner from 'mon-pix/components/module/layout/beta-banner';

<template>
  {{#if @module.isBeta}}
    <ModuleBetaBanner />
  {{/if}}

  <main class="module-recap">
    <div class="module-recap__header">
      <PixButtonLink
        @size="large"
        @route="authenticated.user-dashboard"
        @variant="tertiary"
        @iconAfter="doorOpen"
        class="module-recap-header__icon"
      >
        {{t "pages.modulix.recap.backToModuleDetails"}}
      </PixButtonLink>
    </div>

    <img class="module-recap__illustration" src="/images/modulix/recap-success.svg" alt="" width="228" height="200" />

    <h1 class="module-recap__title">{{t "pages.modulix.recap.title"}}</h1>

    <div class="module-recap__objectives">
      <p class="module-recap-objectives__subtitle">{{t "pages.modulix.recap.subtitle" htmlSafe=true}}</p>
      <ModuleObjectives @objectives={{@module.details.objectives}} />
    </div>

    <div class="module-recap__link-details">
      {{#if @module.redirectionUrl}}
        <PixButtonLink @size="large" @href={{@module.redirectionUrl}} @variant="primary">
          {{t "pages.modulix.recap.goToHomepage"}}
        </PixButtonLink>
      {{else}}
        <PixButtonLink @size="large" @route="authenticated.user-dashboard" @variant="primary">
          {{t "pages.modulix.recap.goToHomepage"}}
        </PixButtonLink>
      {{/if}}

    </div>

    {{#if @module.isBeta}}
      <div class="module-recap__link-form">
        <PixButtonLink
          @size="large"
          @variant="tertiary"
          target="_blank"
          @href="https://form-eu.123formbuilder.com/82940/votre-avis-sur-les-modules-de-formation-pix?3285978={{@passage.id}}"
        >
          {{t "pages.modulix.recap.goToForm"}}
        </PixButtonLink>
      </div>
    {{/if}}
  </main>
</template>
