export const sumBy = (collection, propertyName) => collection.reduce((acc, item) => acc + item[propertyName], 0);

export const sum = (collection) => collection.reduce((acc, item) => acc + item, 0);

export const maxBy = (collection, propertyName) => {
  if (collection.length === 0) return null;
  return collection.reduce(
    (maxItem, item) => (item[propertyName] > maxItem[propertyName] ? item : maxItem),
    collection[0],
  );
};

export const minBy = (collection, propertyName) => {
  if (collection.length === 0) return null;
  return collection.reduce(
    (minItem, item) => (item[propertyName] < minItem[propertyName] ? item : minItem),
    collection[0],
  );
};
