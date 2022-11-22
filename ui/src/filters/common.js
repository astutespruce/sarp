const getIntKeys = (obj) =>
  Object.keys(obj)
    .map((k) => parseInt(k, 10))
    .sort()

/**
 * Get sorted integer keys and labels for each entry in a keyed object
 * @param {Object} obj
 */
export const getEntries = (obj, filter = null) => {
  let values = getIntKeys(obj).sort()

  if (filter) {
    values = values.filter(filter)
  }

  return {
    values,
    labels: values.map((key) => obj[key]),
  }
}
