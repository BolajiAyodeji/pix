import PixAppLayout from '@1024pix/pix-ui/components/pix-app-layout';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import CommunicationBanner from '../communication-banner';
import InformationBanners from '../information-banners';
import ModulixNavigation from '../module/layout/navigation';

export default class ModulixAppLayout extends Component {
  @service featureToggles;
  @service store;

  get isNewPattern() {
    const module = this.store.peekAll('module');
    return module[0].isNewPattern;
  }

  get shouldDisplayNavigation() {
    return this.featureToggles.featureToggles?.isModulixNavEnabled && this.args.isModulixPassage && this.isNewPattern;
  }

  <template>
    <PixAppLayout @variant="modulix" class="modulix-layout">
      <:banner>
        <CommunicationBanner />
        <InformationBanners @banners={{@banners}} />
      </:banner>
      <:navigation>
        {{#if this.shouldDisplayNavigation}}
          <ModulixNavigation />
        {{/if}}
      </:navigation>
      <:main>
        {{yield}}
      </:main>
    </PixAppLayout>
  </template>
}
