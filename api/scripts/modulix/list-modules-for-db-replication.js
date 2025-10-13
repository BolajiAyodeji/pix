import moduleDatasource from '../../src/devcomp/infrastructure/datasources/learning-content/module-datasource.js';

/**
 * List all modules for DB replication with id, slug and title
 * @returns {Promise<void>}
 */
async function listModulesForDBReplication() {
  const imports = await moduleDatasource.list();
  const moduleInformation = imports.map((module) => {
    return { id: module.id, slug: module.slug, title: module.title };
  });
  console.log(JSON.stringify(moduleInformation, null, 2).replace(/"([^"]+)": "([^"]+)"/g, "$1: '$2'"));
}

async function main() {
  await listModulesForDBReplication();
}

await main();
