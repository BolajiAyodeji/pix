import { FilteredOrganization } from '../../../prescription/target-profile/application/api/FilteredOrganization.js';

export const findPaginatedFilteredOrganizationsByTargetProfileId = async ({ targetProfileId, filter, page }) => {
  const organizationData = await usecases.findPaginatedFilteredOrganizationByTargetProfileId({
    targetProfileId,
    filter,
    page,
  });

  return organizationData.models.map((organization) => new FilteredOrganization(organization));
};
