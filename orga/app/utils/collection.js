export const sumBy = (collection, propertyName) => {
  return collection.reduce((acc, item) => acc + item[propertyName], 0);
};
export const sum = (collection) => {
  return collection.reduce((acc, item) => acc + item, 0);
};
