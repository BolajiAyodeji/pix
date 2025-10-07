import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixCheckbox from '@1024pix/pix-ui/components/pix-checkbox';
import PixInput from '@1024pix/pix-ui/components/pix-input';
import PixInputPassword from '@1024pix/pix-ui/components/pix-input-password';
import PixNotificationAlert from '@1024pix/pix-ui/components/pix-notification-alert';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { t } from 'ember-intl';

import isEmailValid from '../../utils/email-validator';
import isPasswordValid from '../../utils/password-validator';

const STATUS = {
  DEFAULT: 'default',
  SUCCESS: 'success',
  ERROR: 'error',
};

const API_ERRORS = {
  INVALID_OR_ALREADY_USED_EMAIL: 'pages.login-or-register.register-form.errors.invalid-or-already-used-email',
};

class LastName {
  @tracked status = STATUS.DEFAULT;
  @tracked message = null;
}

class FirstName {
  @tracked status = STATUS.DEFAULT;
  @tracked message = null;
}

class Email {
  @tracked status = STATUS.DEFAULT;
  @tracked message = null;
}

class Password {
  @tracked status = STATUS.DEFAULT;
  @tracked message = null;
}

class SignupFormValidation {
  lastName = new LastName();
  firstName = new FirstName();
  email = new Email();
  password = new Password();
}

export default class RegisterForm extends Component {
  @service session;
  @service store;
  @service intl;
  @service locale;
  @service url;

  @tracked isLoading = false;
  @tracked firstName = '';
  @tracked lastName = '';
  @tracked email = '';
  @tracked password = '';
  @tracked cguValidationMessage = null;
  @tracked errorMessage = null;
  @tracked validation = new SignupFormValidation();
  @tracked apiErrors = API_ERRORS;

  get cguUrl() {
    return this.url.cguUrl;
  }

  get dataProtectionPolicyUrl() {
    return this.url.dataProtectionPolicyUrl;
  }

  _getErrorMessageForField = (fieldName) => {
    const apiErrorKey = this.validation[fieldName]?.message;

    if (apiErrorKey && this.apiErrors[apiErrorKey]) {
      const errorMessage = this.intl.t(this.apiErrors[apiErrorKey]);
      return errorMessage;
    }
    return false;
  };

  @action
  async register(event) {
    event.preventDefault();
    this.errorMessage = null;
    if (!this._isFormValid()) {
      return;
    }
    this.isLoading = true;
    let user;

    try {
      user = await this.store.createRecord('user', {
        lastName: this.lastName,
        firstName: this.firstName,
        email: this.email,
        password: this.password,
        cgu: true,
        lang: this.locale.currentLanguage,
      });
      await user.save();

      await this._acceptOrganizationInvitation(
        this.args.organizationInvitationId,
        this.args.organizationInvitationCode,
        this.email,
      );

      await this._authenticate(this.email, this.password);

      this.password = null;
    } catch {
      if (user.errors) {
        return this._updateInputsStatus(user);
      }

      this.errorMessage = this.intl.t('pages.login-or-register.register-form.errors.default');
    } finally {
      this.isLoading = false;
    }
  }

  @action
  validatePassword(event) {
    this.validation.password.status = STATUS.DEFAULT;
    this.validation.password.message = null;
    this.password = event.target.value;
    const isInvalidInput = !isPasswordValid(this.password);

    if (isInvalidInput) {
      this.validation.password.status = STATUS.ERROR;
      this.validation.password.message = this.intl.t('pages.login-or-register.register-form.fields.password.error');
    } else {
      this.validation.password.status = STATUS.SUCCESS;
    }
  }

  @action
  validateEmail(event) {
    this.validation.email.status = STATUS.DEFAULT;
    this.validation.email.message = null;
    this.email = event.target.value?.trim().toLowerCase();
    const isInvalidInput = !isEmailValid(this.email);

    if (isInvalidInput) {
      this.validation.email.status = STATUS.ERROR;
      this.validation.email.message = this.intl.t('pages.login-or-register.register-form.fields.email.error');
    } else {
      this.validation.email.status = STATUS.SUCCESS;
    }
  }

  @action
  validateFirstName(event) {
    this.validation.firstName.status = STATUS.DEFAULT;
    this.validation.firstName.message = null;
    this.firstName = event.target.value?.trim();
    const isInvalidInput = this.firstName === '';

    if (isInvalidInput) {
      this.validation.firstName.status = STATUS.ERROR;
      this.validation.firstName.message = this.intl.t('pages.login-or-register.register-form.fields.first-name.error');
    } else {
      this.validation.firstName.status = STATUS.SUCCESS;
    }
  }

  @action
  validateLastName(event) {
    this.validation.lastName.status = STATUS.DEFAULT;
    this.validation.lastName.message = null;
    this.lastName = event.target.value?.trim();
    const isInvalidInput = this.lastName === '';

    if (isInvalidInput) {
      this.validation.lastName.status = STATUS.ERROR;
      this.validation.lastName.message = this.intl.t('pages.login-or-register.register-form.fields.last-name.error');
    } else {
      this.validation.lastName.status = STATUS.SUCCESS;
    }
  }

  @action
  validateCgu() {
    this.cguValidationMessage = null;
    const isInputChecked = Boolean(this.cgu);

    if (!isInputChecked) {
      this.cguValidationMessage = this.intl.t('pages.login-or-register.register-form.fields.cgu.error');
    }
  }

  @action
  updateCgu() {
    this.cgu = !this.cgu;
  }

  _updateInputsStatus(user) {
    const errors = user.errors;
    errors.forEach(({ attribute, message }) => {
      this._updateValidationStatus(attribute, 'error', message);
    });
  }

  _updateValidationStatus(key, status, message) {
    this.validation[key].status = status;
    this.validation[key].message = message;
  }

  _isFormValid() {
    return (
      this.lastName !== '' &&
      this.firstName !== '' &&
      isEmailValid(this.email) &&
      isPasswordValid(this.password) &&
      Boolean(this.cgu)
    );
  }

  _acceptOrganizationInvitation(organizationInvitationId, organizationInvitationCode, createdUserEmail) {
    return this.store
      .createRecord('organization-invitation-response', {
        id: organizationInvitationId + '_' + organizationInvitationCode,
        code: organizationInvitationCode,
        email: createdUserEmail,
      })
      .save({ adapterOptions: { organizationInvitationId } });
  }

  _authenticate(email, password) {
    return this.session.authenticate('authenticator:oauth2', email, password);
  }

  <template>
    <div class="register-form">
      <form {{on "submit" this.register}}>
        <p class="register-form__information">{{t "common.form.mandatory-all-fields"}}</p>
        <div class="input-container">
          <PixInput
            @id="register-firstName"
            name="firstName"
            type="firstName"
            {{on "change" this.validateFirstName}}
            @errorMessage={{this.validation.firstName.message}}
            @validationStatus={{this.validation.firstName.status}}
            required={{true}}
            aria-required="true"
            autocomplete="given-name"
          >
            <:label>{{t "pages.login-or-register.register-form.fields.first-name.label"}}</:label>
          </PixInput>
        </div>

        <div class="input-container">
          <PixInput
            @id="register-lastName"
            name="lastName"
            type="lastName"
            {{on "change" this.validateLastName}}
            @errorMessage={{this.validation.lastName.message}}
            @validationStatus={{this.validation.lastName.status}}
            required={{true}}
            aria-required="true"
            autocomplete="family-name"
          >
            <:label>{{t "pages.login-or-register.register-form.fields.last-name.label"}}</:label>
          </PixInput>

        </div>

        <div class="input-container">
          <PixInput
            @id="register-email"
            name="email"
            type="email"
            {{on "change" this.validateEmail}}
            @errorMessage={{if
              (this._getErrorMessageForField "email")
              (this._getErrorMessageForField "email")
              this.validation.email.message
            }}
            @validationStatus={{this.validation.email.status}}
            required={{true}}
            aria-required="true"
            autocomplete="email"
          >
            <:label>{{t "pages.login-or-register.register-form.fields.email.label"}}</:label>
          </PixInput>
        </div>

        <div class="input-container">
          <PixInputPassword
            @id="register-password"
            name="password"
            autocomplete="current-password"
            required={{true}}
            aria-required="true"
            {{on "change" this.validatePassword}}
            @errorMessage={{this.validation.password.message}}
            @validationStatus={{this.validation.password.status}}
          >
            <:label>{{t "pages.login-or-register.register-form.fields.password.label"}}</:label>
          </PixInputPassword>
        </div>

        <div id="register-cgu-container" class="input-container">
          <div class="checkbox-container">
            <PixCheckbox
              @checked={{this.cgu}}
              required={{true}}
              {{on "click" this.updateCgu}}
              {{on "focusout" this.validateCgu}}
              @screenReaderOnly={{true}}
            >
              <:label>
                {{t "pages.login-or-register.register-form.fields.cgu.aria-label"}}
              </:label>
            </PixCheckbox>

            <p class="register-form__cgu-label">
              {{t "pages.login-or-register.register-form.fields.cgu.accept"}}
              <a href={{this.cguUrl}} class="link" target="_blank" rel="noopener noreferrer">
                {{t "pages.login-or-register.register-form.fields.cgu.terms-of-use"}}
              </a>
              {{t "pages.login-or-register.register-form.fields.cgu.and"}}
              <a href={{this.dataProtectionPolicyUrl}} class="link" target="_blank" rel="noopener noreferrer">
                {{t "pages.login-or-register.register-form.fields.cgu.data-protection-policy"}}
              </a>
            </p>
          </div>
          {{#if this.cguValidationMessage}}
            <p class="register-form__cgu-error" role="alert">{{this.cguValidationMessage}}</p>
          {{/if}}
        </div>

        {{#if this.errorMessage}}
          <PixNotificationAlert @type="error">
            {{this.errorMessage}}
          </PixNotificationAlert>
        {{/if}}

        <div class="input-container">
          <PixButton @type="submit" @isLoading={{this.isLoading}}>
            {{t "pages.login-or-register.register-form.fields.button.label"}}
          </PixButton>
        </div>

      </form>
    </div>
  </template>
}
