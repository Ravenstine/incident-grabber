'use strict';

const calfire = require('calfire');
const inciweb = require('inciweb');
const PouchDB = require('pouchdb');
const deepMerge = require('./lib/deep-merge');

let db = new PouchDB("https://jollypod.com/incidents");

function insert(incident) {
  return new Promise((resolve, reject) => {
    db.get(incident._id)
      .then((doc) => {
        incident._rev = doc._rev;
        return db.put(incident);
      })
      .then((doc) => {
        resolve(`inserted ${incident.name}`);
        // console.log(`inserted ${incident.name}`)
      })
      .catch((err) => {
        return db.put(incident);
      })
      .then(resolve)
      .catch((err) => { let i = incident; debugger; });
  });
}

exports.handler = (event, context, callback) => {
  // kinda hacky but we first get perimeters so we don't
  // have to do it over and over agan, and pass that var
  // to the RSS chain
  let chain = calfire.perimeters();
  calfire.rss().then((incidents) => {
    incidents.forEach((incident) => {
      let link = incident.links.filter(l => l.tags.indexOf('inciweb') > -1)[0];
      chain = chain.then((perimeters) => {
        let pRecord = perimeters.filter((p) => {
          let nameMatcher = new RegExp(p.name || "", "i");
          return (incident.name || "").match(nameMatcher); 
        })[0];
        if(pRecord){
          // if our incident name matches the name of a perimeter record
          // add that perimeter data to our incident
          incident.perimeter = pRecord.perimeter
        }
        // if we have an inciweb link, get more data from inciweb
        if(link){
          return inciweb.get(link.href).then((inciwebIncident) => {
            let mergedIncident = deepMerge(incident, inciwebIncident);
            return insert(mergedIncident).then(() => Promise.resolve(perimeters));
          });
        } else {
          // insert the incident and pass the perimeter data on to the next 
          // chain event
          let mergedIncident = incident;
          return insert(incident).then(() => Promise.resolve(perimeters));
        }
      });
    });
  });
  chain.then(callback).catch(callback);
};

// exports.handler(null,null,console.log);

