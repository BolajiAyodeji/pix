export class ModuleStatus {
  constructor({ id, slug, title, status, duration, image, createdAt, updatedAt, terminatedAt }) {
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.status = status;
    this.duration = duration;
    this.image = image;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.terminatedAt = terminatedAt;
  }
}
