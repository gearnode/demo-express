module.exports.makeRepo = function(client) {
  return {
    _client: client,
    fetchMessages: function() {
      return new Promise((resolve, reject) => {
        this._client.lrange('messages', 0, -1, function(err, data) {
          if (err !== null) {
            return reject(err);
          }
          const messages = data.map(x => {
            const obj = JSON.parse(x);
            return {
              username: `${obj.username}`,
              message: `${obj.message}`,
              ts: `${obj.ts}`,
            };
          });
          resolve(messages);
        });
      });
    },
    addMessage: function(username, message) {
      return new Promise((resolve, reject) => {
        // Force username and message to be a string. This avoid JSON injection
        // in the stored value.
        const ts = Math.round(new Date().getTime() / 1000);
        const msg = {
          username: `${username}`,
          message: `${message}`,
          ts: `${ts}`,
        };
        const data = JSON.stringify(msg);

        this._client.lpush('messages', data, function(err, reply) {
          if (err !== null) {
            return reject(err);
          }
          resolve(msg);
        });
      });
    },
    deleteMessage: function(username, message, ts) {
      const msg = { username: `${username}`, message: `${message}`, ts: ts };
      const data = JSON.stringify(msg);

      return new Promise((resolve, reject) => {
        this._client.lrem('messages', -1, data, function(err, reply) {
          if (err !== null) {
            reject(err);
          }
          resolve();
        });
      });
    },
    fetchUser: function(username) {
      return new Promise((resolve, reject) => {
        this._client.get(`users:${username}`, function(err, data) {
          if (err !== null || data === null) {
            return reject(err);
          }
          const obj = JSON.parse(data);
          const user = {
            username: `${obj.username}`,
            passwordHash: `${obj.passwordHash}`,
          };
          resolve(user);
        });
      });
    },
    putUser: function(username, passwordHash) {
      return new Promise((resolve, reject) => {
        const user = {
          username: `${username}`,
          passwordHash: `${passwordHash}`,
        };
        const data = JSON.stringify(user);
        this._client.set(`users:${username}`, data, function(err, reply) {
          if (err !== null && reply === 'OK') {
            return reject(err);
          }
          resolve(user);
        });
      });
    },
  };
};
