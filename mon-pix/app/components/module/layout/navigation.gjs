import { service } from '@ember/service';
import Component from '@glimmer/component';

export default class ModulixNavigation extends Component {
  @service intl;

  <template>
    <nav>
      <h1>Hello</h1>
    </nav>
  </template>
}
