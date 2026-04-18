const db = require("../config/db");

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

module.exports = {
  run,
  get,
  all,
};
