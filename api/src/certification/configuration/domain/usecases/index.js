import * as challengeRepository from '../../../../shared/infrastructure/repositories/challenge-repository.js';
import * as skillRepository from '../../../../shared/infrastructure/repositories/skill-repository.js';
import * as tubeRepository from '../../../../shared/infrastructure/repositories/tube-repository.js';
import { injectDependencies } from '../../../../shared/infrastructure/utils/dependency-injection.js';
import * as flashAlgorithmConfigurationRepository from '../../../configuration/infrastructure/repositories/flash-algorithm-configuration-repository.js';
import * as sharedFlashAlgorithmConfigurationRepository from '../../../shared/infrastructure/repositories/flash-algorithm-configuration-repository.js';
import * as activeCalibratedChallengeRepository from '../../infrastructure/repositories/active-calibrated-challenge-repository.js';
import * as attachableTargetProfileRepository from '../../infrastructure/repositories/attachable-target-profiles-repository.js';
import * as candidateRepository from '../../infrastructure/repositories/candidate-repository.js';
import * as centerRepository from '../../infrastructure/repositories/center-repository.js';
import * as complementaryCertificationRepository from '../../infrastructure/repositories/complementary-certification-repository.js';
import * as consolidatedFrameworkRepository from '../../infrastructure/repositories/consolidated-framework-repository.js';
import * as learningContentRepository from '../../infrastructure/repositories/learning-content-repository.js';

/**
 *
 * Using {@link https://jsdoc.app/tags-type "Closure Compiler's syntax"} to document injected dependencies
 *
 * @typedef {activeCalibratedChallengeRepository} ActiveCalibratedChallengeRepository
 * @typedef {attachableTargetProfileRepository} AttachableTargetProfileRepository
 * @typedef {candidateRepository} CandidateRepository
 * @typedef {centerRepository} CenterRepository
 * @typedef {challengeRepository} ChallengeRepository
 * @typedef {complementaryCertificationRepository} ComplementaryCertificationRepository
 * @typedef {consolidatedFrameworkRepository} ConsolidatedFrameworkRepository
 * @typedef {learningContentRepository} LearningContentRepository
 * @typedef {skillRepository} SkillRepository
 * @typedef {tubeRepository} TubeRepository
 * @typedef {flashAlgorithmConfigurationRepository} FlashAlgorithmConfigurationRepository
 * @typedef {sharedFlashAlgorithmConfigurationRepository} SharedFlashAlgorithmConfigurationRepository
 **/
const dependencies = {
  activeCalibratedChallengeRepository,
  attachableTargetProfileRepository,
  candidateRepository,
  centerRepository,
  challengeRepository,
  complementaryCertificationRepository,
  consolidatedFrameworkRepository,
  learningContentRepository,
  skillRepository,
  tubeRepository,
  flashAlgorithmConfigurationRepository,
  sharedFlashAlgorithmConfigurationRepository,
};

import { calibrateConsolidatedFramework } from './calibrate-consolidated-framework.js';
import { catchingUpCandidateReconciliation } from './catching-up-candidate-reconciliation.js';
import { createCertificationVersion } from './create-consolidated-framework.js';
import { createFlashAssessmentConfiguration } from './create-flash-assessment-configuration.js';
import { exportScoWhitelist } from './export-sco-whitelist.js';
import { findComplementaryCertifications } from './find-complementary-certifications.js';
import { getActiveFlashAssessmentConfiguration } from './get-active-flash-assessment-configuration.js';
import { getCurrentConsolidatedFramework } from './get-current-consolidated-framework.js';
import { getFrameworkHistory } from './get-framework-history.js';
import { importScoWhitelist } from './import-sco-whitelist.js';
import { searchAttachableTargetProfiles } from './search-attachable-target-profiles.js';

const usecasesWithoutInjectedDependencies = {
  calibrateConsolidatedFramework,
  catchingUpCandidateReconciliation,
  createCertificationVersion,
  createFlashAssessmentConfiguration,
  exportScoWhitelist,
  findComplementaryCertifications,
  getActiveFlashAssessmentConfiguration,
  getCurrentConsolidatedFramework,
  getFrameworkHistory,
  importScoWhitelist,
  searchAttachableTargetProfiles,
};

const usecases = injectDependencies(usecasesWithoutInjectedDependencies, dependencies);

/**
 * @typedef {dependencies} dependencies
 */
export { usecases };
