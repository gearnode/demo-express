module.exports.homePage = function({ username, csrfToken, messages }) {
  const loginForm = `
    <h1>signin</h1>
    <form method="post" action="/login">
      <input type="hidden" name="_csrf" value="${csrfToken}"/>
      <label>username:</label>
      <input name="username" type="text"/>
      <label>password:</label>
      <input name="password" type="password"/>
      <button>login</submit>
    </form>
  `;

  const signupForm = `
    <h1>signup</h1>
    <form method="post" action="/signup">
      <input type="hidden" name="_csrf" value="${csrfToken}"/>
      <label>username:</label>
      <input name="username" type="text"/>
      <label>password:</label>
      <input name="password" type="password"/>
      <label>password confirmation:</label>
      <input name="check_password" type="password"/>
      <button>signup</submit>
    </form>
  `;

  const logoutForm = `
    <form method="post" action="/logout">
      <input type="hidden" name="_csrf" value="${csrfToken}"/>
      <button>logout</submit>
    </form>
  `;
  const messageList = function() {
    const deleteForm = function(msg) {
      return `
      <form method="POST" action="/messages/delete">
        <input type="hidden" name="_csrf" value="${csrfToken}"/>
        <input type="hidden" name="message" value="${msg.message}"/>
        <input type="hidden" name="ts" value="${msg.ts}"/>
        <input type="hidden" name="username" value="${msg.username}" />
        <button>delete</submit>
      </form>
    `
   }

    return messages
      .map(x => {
        return `
          <li>
          <b>${x.username}:</b>
            ${x.message} -
            ${ username !== x.username ? "" : deleteForm(x) }</li>`}).join('');
  };

  const newMessageForm = `
    <form method="post" action="/messages">
      <input type="hidden" name="_csrf" value="${csrfToken}"/>
      <label>message:</label>
      <input name="message" type="text"/>
      <button>send</submit>
    </form>
  `;

  return `
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Demo App</title>
    </head>
      <body>
        <h1>HTML page over TLS</h1>
          <div>
            ${username === undefined ? loginForm : logoutForm}
          </div>
          <div>
            ${username === undefined ? signupForm : ''}
          </div>
        <h1>Messages</h1>
        <div>
          <ul>
            ${messageList()}
          </ul>
        </div>
        <div>
          ${username === undefined ? "" : newMessageForm}
        </div>
      </body>
    </head>
  `;
};
