const TABLE_NAME = 'organizations';
const COLUMN_NAME = 'administrationTeamId';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, function (table) {
    table.integer(COLUMN_NAME).comment("Ce champ permet d'indiquer l'équipe en charge.").alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, function (table) {
    table.integer(COLUMN_NAME).comment("Reference to the organization's administration team").alter();
  });
};

export { down, up };
