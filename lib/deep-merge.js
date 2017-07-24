'use strict';

const lockedFields = [
  'href',
  'slug'
]

function isLockedField(key){
  return (lockedFields.indexOf(key) > -1) ? true : false;
}

function deepMerge(a, b){
  Object.keys(a).forEach((key) => {
    let aVal = a[key];
    let bVal = b[key];
    if(isLockedField(key) || (bVal === void(0))){
      // don't unset existing values
      return;
    }
    if(Array.isArray(aVal) && Array.isArray(bVal)){
      // concat if we have two arrays
      return a[key] = aVal.concat(bVal);
    }
    if((typeof aVal === 'object') && (typeof bVal === 'object')) {
      // if we have two objects, do a deep replace
      return a[key] = deepMerge(aVal, bVal);
    }
    return a[key] = bVal;
  })
  return a;
}

module.exports = deepMerge;

