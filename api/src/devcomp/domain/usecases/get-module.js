import { config } from '../../../shared/config.js';
import { cryptoService } from '../../../shared/domain/services/crypto-service.js';

async function getModule({ slug, redirectionHash, moduleRepository }) {
  const module = await moduleRepository.getBySlug({ slug });

  if (redirectionHash) {
    const redirectionUrl = await cryptoService.decrypt(redirectionHash, config.module.secret);

    if (redirectionUrl) {
      module.setRedirectionUrl(redirectionUrl);
    }
  }

  return module;
}

export { getModule };
