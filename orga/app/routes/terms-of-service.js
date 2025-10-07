import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class TermsOfServiceRoute extends Route {
  @service currentUser;
  @service router;
  @service session;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'login');

    if (transition.isAborted) {
      return;
    }

    const pixOrgaTermsOfServiceStatus = this.currentUser?.prescriber?.pixOrgaTermsOfServiceStatus;
    if (pixOrgaTermsOfServiceStatus === 'accepted') {
      return this.router.replaceWith('');
    }
  }

  model() {
    return {
      legalDocumentStatus: this.currentUser.prescriber.pixOrgaTermsOfServiceStatus,
      legalDocumentPath: this.currentUser.prescriber.pixOrgaTermsOfServiceDocumentPath,
    };
  }
}
