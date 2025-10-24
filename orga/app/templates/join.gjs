import PixNotificationAlert from '@1024pix/pix-ui/components/pix-notification-alert';
import t from 'ember-intl/helpers/t';
import pageTitle from 'ember-page-title/helpers/page-title';
import LoginForm from 'pix-orga/components/auth/login-form';
import LoginOrRegister from 'pix-orga/components/auth/login-or-register';
import AuthenticationLayout from 'pix-orga/components/authentication-layout/index';

<template>
  {{#if @controller.isNewAuthDesignEnabled}}
    {{pageTitle (t "pages.login-or-register.title" organizationName=@model.organizationName)}}

    <AuthenticationLayout class="signin-page-layout">
      <:header>
      </:header>

      <:content>
        <PixNotificationAlert @type="communication-orga">
          {{t "pages.login.join-invitation" organizationName=@model.organizationName}}
        </PixNotificationAlert>

        <div>
          <h1 class="pix-title-m">{{t "pages.login.title"}}</h1>
          <h3 class="pix-body-l">{{t "pages.login.with-pix-account"}}</h3>
        </div>

        <LoginForm
          @isWithInvitation={{true}}
          @hasInvitationAlreadyBeenAccepted={{@controller.hasInvitationAlreadyBeenAccepted}}
          @isInvitationCancelled={{@controller.isInvitationCancelled}}
          @organizationInvitationId={{@controller.invitationId}}
          @organizationInvitationCode={{@controller.code}}
        />
      </:content>
    </AuthenticationLayout>
  {{else}}
    {{pageTitle (t "pages.login-or-register.title" organizationName=@model.organizationName)}}
    <div class="join-page">
      <LoginOrRegister
        @organizationInvitationId={{@controller.invitationId}}
        @organizationInvitationCode={{@controller.code}}
        @organizationName={{@model.organizationName}}
      />
    </div>
  {{/if}}
</template>
