import { clickByName, fillByLabel, visit } from '@1024pix/ember-testing-library';
import { click, currentURL } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { t } from 'ember-intl/test-support';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateAdminMemberWithRole } from 'pix-admin/tests/helpers/test-init';
import { module, test } from 'qunit';

import setupIntl from '../../../helpers/setup-intl';

module('Acceptance | Organizations | Create', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupIntl(hooks);

  hooks.beforeEach(async function () {
    await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
  });

  test('it should set organizations menubar item active', async function (assert) {
    // when
    const screen = await visit('/organizations/new');

    // then
    assert.dom(screen.getByRole('link', { name: 'Organisations' })).hasClass('active');
  });

  module('when creating an organization without a parent organization', function () {
    test('it shows the creation form without parent organization name', async function (assert) {
      // when
      const screen = await visit('/organizations/new');

      // then
      assert.dom(screen.queryByText('Organisation mère')).doesNotExist();
      assert.dom(screen.getByText('Nouvelle organisation')).exists();
      assert.dom(screen.getByRole('button', { name: 'Ajouter' })).exists();
    });
  });

  module('when creating an organization with a parent organization', function () {
    test('it shows the creation form with parent organization name', async function (assert) {
      // given
      const parentOrganization = server.create('organization', { name: 'Wayne Enterprises' });

      // when
      const screen = await visit(
        `/organizations/new?parentOrganizationId=${parentOrganization.id}&parentOrganizationName=${encodeURIComponent(
          parentOrganization.name,
        )}`,
      );

      // then
      assert.dom(screen.getByText(`Organisation mère : ${parentOrganization.name}`)).exists();
      assert.dom(screen.getByText('Nouvelle organisation fille')).exists();
      assert.dom(screen.getByRole('button', { name: 'Ajouter une organisation fille' })).exists();
    });
  });

  module('when an organization is created', function () {
    test('it redirects the user on the organization details page on tags tab', async function (assert) {
      // given
      const screen = await visit('/organizations/new');
      await fillByLabel('Nom *', 'Stark Corp.');

      await click(screen.getByRole('button', { name: `Sélectionner un type d'organisation *` }));
      await screen.findByRole('listbox');
      await click(screen.getByRole('option', { name: 'Établissement scolaire' }));

      await click(
        screen.getByRole('button', {
          name: `${t('components.organizations.creation.administration-team.selector.label')} *`,
        }),
      );
      await screen.findByRole('listbox');
      await click(screen.getByText('Équipe 2'));

      await fillByLabel('Crédits', 120);

      await fillByLabel('Prénom du DPO', 'Justin');
      await fillByLabel('Nom du DPO', 'Ptipeu');
      await fillByLabel('Adresse e-mail du DPO', 'justin.ptipeu@example.net');

      // when
      await clickByName('Ajouter');

      // then
      assert.strictEqual(currentURL(), '/organizations/1/all-tags');
    });

    test('it shows validation errors if form is not correctly filled', async function (assert) {
      // given
      const screen = await visit('/organizations/new');
      await fillByLabel('Nom *', 'Stark Corp.');

      // when
      await clickByName('Ajouter');

      // then
      assert
        .dom(screen.getByText(t('components.organizations.creation.administration-team.required-fields-error')))
        .exists();
    });
  });
});
