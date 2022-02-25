const express = require("express");
const Entry = require("../models/entries");
const router = express.Router();

router.get("/new", (req, res) => {
  res.render("entries/new", { entry: new Entry() });
});

router.get("/edit/:id", async (req, res) => {
  const entry = await Entry.findById(req.params.id);
  res.render("entries/edit", { entry: entry });
});

router.get("/:slug", async (req, res) => {
  const entry = await Entry.findOne({ slug: req.params.slug });
  if (entry == null) res.redirect("/");
  res.render("entries/show", { entry: entry });
});

router.post(
  "/",
  async (req, res, next) => {
    req.entry = new Entry();
    next();
  },
  saveEntryAndRedirect("new")
);

router.put(
  "/:id",
  async (req, res, next) => {
    req.entry = await Entry.findById(req.params.id);
    next();
  },
  saveEntryAndRedirect("edit")
);

router.delete("/:id", async (req, res) => {
  await Entry.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

function saveEntryAndRedirect(path) {
  return async (req, res) => {
    let entry = req.entry;
    entry.user = req.session.user._id;
    entry.title = req.body.title;
    entry.description = req.body.description;
    entry.journal = req.body.journal;
    try {
      entry = await entry.save();
      res.redirect(`/entries/${entry.slug}`);
    } catch (e) {
      res.render(`entries/${path}`, { entry: entry });
    }
  };
}

module.exports = router;
