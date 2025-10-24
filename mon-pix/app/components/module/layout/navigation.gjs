import PixIconButton from '@1024pix/pix-ui/components/pix-icon-button';
import PixNavigation from '@1024pix/pix-ui/components/pix-navigation';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';

export default class ModulixNavigation extends Component {
  @service intl;

  @action
  dropAllTables() {}

  <template>
    <PixNavigation
      class="app-navigation module-navigation"
      @navigationAriaLabel={{t "navigation.nav-bar.aria-label"}}
      @openLabel={{t "navigation.nav-bar.open"}}
      @closeLabel={{t "navigation.nav-bar.close"}}
    >
      <:brand>
        <img class="module-navigation__logo" src="/images/logo-pix-couleur.svg" alt={{t "navigation.homepage"}} />
      </:brand>
      <:navElements>
        <PixIconButton
          class="module-navigation__button"
          @ariaLabel={{t "pages.modulix.section.question-yourself"}}
          @triggerAction={{this.dropAllTables}}
          @iconName="doorOpen"
        />
        <PixIconButton
          class="module-navigation__button"
          @ariaLabel={{t "pages.modulix.section.retain-the-essentials"}}
          @triggerAction={{this.dropAllTables}}
          @iconName="lightBulb"
        />
        <PixIconButton
          class="module-navigation__button"
          @ariaLabel={{t "pages.modulix.section.explore-to-understand"}}
          @triggerAction={{this.dropAllTables}}
          @iconName="signpost"
        />
        <PixIconButton
          class="module-navigation__button"
          @ariaLabel={{t "pages.modulix.section.practise"}}
          @triggerAction={{this.dropAllTables}}
          @iconName="think"
        />
        <PixIconButton
          class="module-navigation__button"
          @ariaLabel={{t "pages.modulix.section.go-further"}}
          @triggerAction={{this.dropAllTables}}
          @iconName="mountain"
        />
      </:navElements>
    </PixNavigation>
  </template>
}
