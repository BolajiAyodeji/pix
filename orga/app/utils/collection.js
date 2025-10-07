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

export const orderBy = (collection, propertyNames, orders) => {
  if (collection.length === 0) return [];

  if (!Array.isArray(propertyNames)) {
    propertyNames = [propertyNames];
  }
  if (!Array.isArray(orders)) {
    orders = [orders];
  }

  const propertyOrders = propertyNames.map((propertyName, index) => [propertyName, orders[index] ?? 'asc']);

  return collection.toSorted((a, b) => {
    for (const [propertyName, order = 'asc'] of propertyOrders) {
      const aValue = a[propertyName];
      const bValue = b[propertyName];
      let comparisonResult;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparisonResult = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparisonResult = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparisonResult = aValue - bValue;
      } else {
        comparisonResult = aValue.toString().localeCompare(bValue.toString());
      }
      if (comparisonResult !== 0) {
        return order === 'asc' ? comparisonResult : -comparisonResult;
      }
    }
    return 0;
  });
};

export function pick(source, properties) {
  const object = {};
  properties.forEach((property) => {
    if (!source[property] && !Object.hasOwn(source, property)) {
      return;
    }
    object[property] = source[property];
  });
  return object;
}
