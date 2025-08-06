import ApplicationAdapter from './application';

export default class Module extends ApplicationAdapter {
  queryRecord(store, type, query) {
    if (query.slug) {
      let url = `${this.host}/${this.namespace}/modules/${query.slug}`;

      if (query.redirectionHash) {
        const redirectionHash = encodeURIComponent(query.redirectionHash);
        url += `?redirectionHash=${redirectionHash}`;
      }

      return this.ajax(url, 'GET');
    }

    return super.queryRecord(...arguments);
  }
}
