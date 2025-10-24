import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CombinedCourseRoute extends Route {
  @service store;
  @service router;

  queryParams = {
    pageNumber: { refreshModel: true },
    pageSize: { refreshModel: true },
    fullName: { refreshModel: true },
    statuses: { refreshModel: true },
  };

  async model(params) {
    const combinedCourse = this.modelFor('authenticated.combined-course');
    const combinedCourseParticipations = await this.store
      .query('combined-course-participation', {
        combinedCourseId: combinedCourse.id,
        page: {
          number: params.pageNumber,
          size: params.pageSize,
        },
        filters: {
          fullName: params.fullName,
          statuses: params.statuses,
        },
      })
      .catch((error) => {
        console.error(error);
        this.router.replaceWith('not-found');
      });

    return combinedCourseParticipations;
  }
}
