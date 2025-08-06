const getBySlug = async function (request, h, { moduleSerializer, usecases }) {
  const { slug } = request.params;
  const redirectionHash = request.query.redirectionHash;
  const module = await usecases.getModule({ slug, redirectionHash });

  return moduleSerializer.serialize(module);
};

const modulesController = { getBySlug };

export { modulesController };
