import * as tutorialRepository from '../../../devcomp/infrastructure/repositories/tutorial-repository.js';
import * as userApi from '../../../identity-access-management/application/api/users-api.js';
import * as campaignApi from '../../../prescription/campaign/application/api/campaigns-api.js';
import * as knowledgeElementSnapshotAPI from '../../../prescription/campaign/application/api/knowledge-element-snapshots-api.js';
import * as targetProfileApi from '../../../prescription/target-profile/application/api/target-profile-api.js';
import { fromDatasourceObject } from '../../../shared/infrastructure/adapters/solution-adapter.js';
import { injectDependencies } from '../../../shared/infrastructure/utils/dependency-injection.js';
import { getCorrection } from '../../domain/services/solution/solution-service-qrocm-dep.js';
import * as autonomousCourseRepository from './autonomous-course-repository.js';
import * as autonomousCourseTargetProfileRepository from './autonomous-course-target-profile-repository.js';
import * as badgeCriteriaRepository from './badge-criteria-repository.js';
import * as correctionRepository from './correction-repository.js';
import * as knowledgeElementRepository from './knowledge-element-repository.js';
import * as userRepository from './user-repository.js';

const repositoriesWithoutInjectedDependencies = {
  autonomousCourseRepository,
  autonomousCourseTargetProfileRepository,
  badgeCriteriaRepository,
  userRepository,
  correctionRepository,
  knowledgeElementRepository,
};

const dependencies = {
  campaignApi,
  targetProfileApi,
  userApi,
  tutorialRepository,
  fromDatasourceObject,
  getCorrection,
  knowledgeElementSnapshotAPI,
};

const repositories = injectDependencies(repositoriesWithoutInjectedDependencies, dependencies);

export { repositories };
