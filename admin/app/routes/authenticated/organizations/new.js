import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { runTask } from 'ember-lifeline';

export default class NewRoute extends Route {
  @service router;
  @service store;
  @service accessControl;

  queryParams = {
    parentOrganizationId: { refreshModel: true },
    parentOrganizationName: { refreshModel: true },
  };

  beforeModel() {
    this.accessControl.restrictAccessTo(['isSuperAdmin', 'isSupport', 'isMetier'], 'authenticated');
  }

  afterModel(_, transition) {
    const queryParams = transition?.to?.queryParams ?? {};

    if (Object.keys(queryParams).length === 0) {
      return;
    }

    if (!queryParams.parentOrganizationId && !queryParams.parentOrganizationName) {
      return;
    }

    if (_hasParentOrganizationQueryParamsAndOneIsMissing(queryParams)) {
      runTask(this, () => {
        this.router.replaceWith(this.routeName, {
          queryParams: {
            parentOrganizationId: null,
            parentOrganizationName: null,
          },
        });
      });
    }
  }

  model() {
    return this.store.createRecord('organization');
  }

  resetController(controller, isExiting) {
    if (isExiting) {
      controller.parentOrganizationId = null;
      controller.parentOrganizationName = null;
    }
  }
}

function _hasParentOrganizationQueryParamsAndOneIsMissing(queryParams) {
  return (
    Object.keys(queryParams).length > 0 && (!queryParams.parentOrganizationName || !queryParams.parentOrganizationId)
  );
}
