const escape_html = require('escape-html');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || 10);

module.exports.createUserChangeset = function(
  username,
  password,
  passwordConfirmation
) {
  if (username === undefined) {
    return new Error('username is required.');
  }

  if (username.length < 3 || username.length > 30) {
    return new Error('username is too small or too large.');
  }

  const escapeUsername = escape_html(username);
  if (username !== escapeUsername) {
    return new Error('username may contain xss attack.');
  }

  if (password === undefined || passwordConfirmation === undefined) {
    return new Error('password and passwordConfirmation are required.');
  }

  if (password.length < 5 || password.length > 50) {
    return new Error('password is too small or too large.');
  }

  if (password !== passwordConfirmation) {
    return new Error('passwordConfirmation mismatch.');
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  return { username: `${escapeUsername}`, passwordHash: passwordHash };
};

module.exports.loginUserChangeset = function(username, password) {
  if (username === undefined) {
    return new Error('username is required.');
  }

  if (password === undefined) {
    return new Error('password is required.');
  }

  const escapeUsername = escape_html(username);
  if (username !== escapeUsername) {
    return new Error('username may contain xss attack.');
  }

  return { username: `${username}`, password: `${password}` };
};

module.exports.authenticateUser = function(user, password) {
  if (bcrypt.compareSync(password, user.passwordHash)) {
    return true;
  }
  return false;
};
