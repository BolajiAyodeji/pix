class InvigilatorSession {
  constructor({ finalizedAt, invigilatorPassword }) {
    this.invigilatorPassword = invigilatorPassword;
    this.finalizedAt = finalizedAt;
  }

  isAccessible() {
    return this.finalizedAt === null;
  }

  checkPassword(invigilatorPassword) {
    return this.invigilatorPassword === invigilatorPassword;
  }
}

export { InvigilatorSession };
