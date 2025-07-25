import * as attachTargetProfile from './application/attach-target-profile-route.js';
import * as complementaryCertification from './application/complementary-certification-route.js';
import * as scoWhitelist from './application/sco-whitelist-route.js';

const certificationConfigurationRoutes = [complementaryCertification];
const scoWhitelistRoutes = [scoWhitelist];
const attachTargetProfileRoutes = [attachTargetProfile];

export { attachTargetProfileRoutes, certificationConfigurationRoutes, scoWhitelistRoutes };
