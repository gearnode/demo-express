const { createServer } = require('https');
const { readFileSync } = require('fs');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const redisStore = require('connect-redis')(session);
const redis = require('redis');
const { homePage } = require('./home_page');
const { makeRepo } = require('./redis_repository');
const { createMessageChangeset } = require('./message');
const {
  createUserChangeset,
  loginUserChangeset,
  authenticateUser,
} = require('./user');

const db = redis.createClient({ db: 0, host: '127.0.0.1', port: 6379 });
const app = express();
const repo = makeRepo(db);
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ['*'],
      upgradeInsecureRequests: true,
    },
  })
);
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })
);
app.use(helmet.ieNoOpen());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use(
  session({
    store: new redisStore({ host: 'localhost', port: 6379 }),
    name: 'SSID',
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true, httpOnly: true, domain: '.myapp.dev', path: '/' },
  })
);

app.get('/', function(req, res) {
  const currentUser = req.session.currentUser || {};

  repo.fetchMessages()
    .then(function(messages) {
      res.send(
        homePage({
          username: currentUser.username,
          csrfToken: req.csrfToken(),
          messages: messages,
        })
      );
    })
    .catch(function(err) {
      res.send('internal server error.');
      return;
    });
});

app.post('/signup', function(req, res) {
  const changeset = createUserChangeset(
    req.body.username,
    req.body.password,
    req.body.check_password
  );

  if (changeset instanceof Error) {
    res.send(changeset.message);
    return;
  }

  repo
    .putUser(changeset.username, changeset.passwordHash)
    .then(function(user) {
      req.session.currentUser = user;
      res.redirect('/');
    })
    .catch(function(err) {
      res.send('internal server error');
    });
});

app.post('/login', function(req, res) {
  const changeset = loginUserChangeset(req.body.username, req.body.password);

  if (changeset instanceof Error) {
    res.send(changeset.message);
    return;
  }

  repo
    .fetchUser(changeset.username)
    .then(function(user) {
      if (authenticateUser(user, changeset.password)) {
        req.session.currentUser = user;
        res.redirect('/');
        return;
      }
      res.send('bad credentials.');
    })
    .catch(function(err) {
      res.send('bad credentials.');
    });
});

app.post('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.post('/messages', function(req, res) {
  if (req.session.currentUser === undefined) {
    res.send('invalid creds');
    return;
  }

  const changeset = createMessageChangeset(
    req.session.currentUser.username,
    req.body.message
  );
  if (changeset instanceof Error) {
    res.send(changeset.message);
    return;
  }

  repo
    .addMessage(changeset.username, changeset.message)
    .then(function(message) {
      res.redirect('/');
    })
    .catch(function(error) {
      res.send('internal server error.');
    });
});

app.post('/messages/delete', function(req, res) {
  console.log("sess user:", req.session.currentUser.username, " user:", req.body.username)
  if  (req.session.currentUser.username !== req.body.username) {
    res.send('invalid access');
    return;
  }

  repo
    .deleteMessage(req.session.currentUser.username, req.body.message, req.body.ts)
    .then(x => res.redirect('/'))
    .catch(x => res.send('internal server error'))
})

createServer(
  {
    key: readFileSync(process.env.SSL_KEY),
    cert: readFileSync(process.env.SSL_CERT),
  },
  app
).listen(process.env.PORT);
