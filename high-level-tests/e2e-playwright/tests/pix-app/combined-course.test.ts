import { databaseBuilder } from '../../helpers/db.js';
import { expect, test } from '../../helpers/fixtures.js';

test('pass a combined course as sco user', async ({ page }) => {
  const TARGET_PROFILE_TUBES = [
    {
      id: 'recSqw34xWSLgEgt',
      level: 1,
    },
  ];
  const CAMPAIGN_SKILLS = ['rec1aqbvWEqtoMOLw'];
  const email = 'alex.terieur@example.net';
  databaseBuilder.factory.buildUser.withRawPassword({ email });
  const organizationId = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true }).id;
  const firstName = 'Alex';
  const lastName = 'Terieur';
  const birthdate = new Date('2010-07-10');
  databaseBuilder.factory.buildOrganizationLearner({ organizationId, firstName, lastName, birthdate, userId: null });
  const targetProfile = databaseBuilder.factory.buildTargetProfile({
    ownerOrganizationId: organizationId,
    tubes: TARGET_PROFILE_TUBES,
  });
  const campaign = databaseBuilder.factory.buildCampaign({
    targetProfileId: targetProfile.id,
    organizationId,
    customResultPageButtonText: 'Continuer',
    customResultPageButtonUrl: 'http://localhost:4200/parcours/COMBINIX1',
  });
  databaseBuilder.factory.buildCampaignSkill({
    campaignId: campaign.id,
    skillId: CAMPAIGN_SKILLS[0],
  });
  const training = databaseBuilder.factory.buildTraining({
    type: 'modulix',
    link: '/modules/demo-combinix-1',
    locale: 'fr',
  });
  const moduleId1 = 'eeeb4951-6f38-4467-a4ba-0c85ed71321a';
  databaseBuilder.factory.buildTargetProfileTraining({ targetProfileId: targetProfile.id, trainingId: training.id });
  databaseBuilder.factory.buildTrainingTrigger({ trainingId: training.id, threshold: 0, type: 'prerequisite' });
  databaseBuilder.factory.buildTrainingTrigger({ trainingId: training.id, threshold: 100, type: 'goal' });

  databaseBuilder.factory.buildQuestForCombinedCourse({
    code: 'COMBINIX1',
    organizationId,
    rewardId: null,
    rewardType: null,
    successRequirements: [
      {
        requirement_type: 'campaignParticipations',
        comparison: 'all',
        data: {
          campaignId: {
            data: campaign.id,
            comparison: 'equal',
          },
          status: {
            data: 'SHARED',
            comparison: 'equal',
          },
        },
      },
      {
        requirement_type: 'passages',
        comparison: 'all',
        data: {
          moduleId: {
            data: moduleId1,
            comparison: 'equal',
          },
          isTerminated: {
            data: true,
            comparison: 'equal',
          },
        },
      },
    ],
  });
  await databaseBuilder.commit();

  await page.goto('http://localhost:4200/parcours/COMBINIX1/');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('textbox', { name: 'Adresse e-mail ou identifiant' }).fill('alex.terieur@example.net');
  await page.getByRole('textbox', { name: 'Mot de passe *' }).fill('pix123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('textbox', { name: 'Prénom' }).fill('Alex');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Terieur');
  await page.getByRole('textbox', { name: 'jour de naissance' }).fill('10');
  await page.getByRole('textbox', { name: 'mois de naissance' }).fill('07');
  await page.getByRole('textbox', { name: 'année de naissance' }).fill('2010');
  await page.getByRole('button', { name: "C'est parti !" }).click();
  await page.getByRole('button', { name: 'Associer' }).click();
  await page.getByRole('button', { name: 'Commencer mon parcours' }).click();
  await page.getByRole('link', { name: 'Name' }).click();
  await page.getByRole('button', { name: 'Je commence' }).click();
  await page.getByRole('button', { name: 'Ignorer' }).click();
  await page.getByRole('button', { name: 'Je passe et je vais à la' }).click();
  //A cause de la pop-up de modulix en fin de parcours
  await page.locator('#ember138').click();
  await page.getByRole('button', { name: "J'envoie mes résultats" }).click();
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.getByRole('link', { name: 'Continuer' }).click();
  await page.getByRole('link', { name: 'Demo combinix' }).click();
  await page.getByRole('button', { name: 'Commencer le module' }).click();
  await page.getByRole('button', { name: 'Terminer' }).click();
  await page.getByRole('link', { name: 'Continuer' }).click();
  //A cause de la redirection en fin de module, mais va être geree differement
  await page.goto('http://localhost:4200/parcours/COMBINIX1');
  await expect(page.getByRole('heading', { name: 'Félicitations ! Vous avez terminé !' })).toBeVisible();
});
