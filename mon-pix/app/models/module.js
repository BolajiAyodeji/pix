import Model, { attr, hasMany } from '@ember-data/model';

export default class Module extends Model {
  @attr('string') slug;
  @attr('string') title;
  @attr('boolean') isBeta;
  @attr() details;
  @attr('string') version;
  @attr('string') redirectionUrl;
  @hasMany('grain', { async: false, inverse: 'module' }) grains;
}
