const escape_html = require('escape-html');

module.exports.createMessageChangeset = function(username, message) {
  if (username === undefined) {
    return new Error('username is required.');
  }

  if (message === undefined) {
    return new Error('message is required.');
  }

  if (message.length < 1 || message.length > 135) {
    return new Error('message is too small or too long.');
  }

  const escapeUsername = escape_html(username);
  if (username !== escapeUsername) {
    return new Error('username may contain xss attack.');
  }

  const escapeMessage = escape_html(message);

  return { username: `${escapeUsername}`, message: `${escapeMessage}` };
};
