const express = require("express");
const mongoose = require("mongoose");
const entryRouter = require("./routes/entries");
const methodOverride = require("method-override");
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const csrf = require('csurf');

const User = require('./models/user')
const Entry = require("./models/entries");
const authRoutes = require('./routes/auth');

const MONGODB_URL = "mongodb://mongo:27017/journal-app"

const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  if (res.locals.isAuthenticated) { res.locals.user = req.session.user._id.toString(); }

  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.get("/", async (req, res) => {
  const entries = await Entry.find().sort({ createdAt: "desc" });
  res.render("entries/index", {
    entries: entries,
    isAuthenticated: req.session.isLoggedIn,
    path: '/index'
  });
});

app.use(authRoutes);
app.use("/entries", entryRouter);

mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.listen(process.env.PORT || 3000);