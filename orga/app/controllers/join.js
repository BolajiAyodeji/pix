import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class JoinController extends Controller {
  @service featureToggles;

  get isNewAuthDesignEnabled() {
    return this.featureToggles.featureToggles.usePixOrgaNewAuthDesign;
  }

  queryParams = ['code', 'invitationId'];
  code = null;
  invitationId = null;
}
