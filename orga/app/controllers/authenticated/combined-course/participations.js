import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ParticipationsController extends Controller {
  queryParams = ['fullName', 'statuses'];

  @tracked fullName = null;
  @tracked statuses = null;

  @tracked model;

  @action
  triggerFiltering(fieldName, value) {
    this[fieldName] = value;
  }

  // get filteredParticipations() {
  //   let fullNameFilter = this.fullName;
  //   let statusesFilter = this.statuses;
  //   let participations = this.model;
  // }
}
