const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
  let query = {};
  console.log(req.query);

  if (req.query.category) {
    query.category = req.query.category; // Find listings with the selected category
  }

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { location: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const allListings = await Listing.find(query);

  res.render("listings/index.ejs", {
    allListings,
    selectedCategory: req.query.category || null,
    searchQuery: req.query.search || "",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const API_KEY = process.env.MAP_TOKEN;
  const query = req.body.listing.location;
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(
      query
    )}.json?key=${API_KEY}`
  );
  const data = await (await response).json();
  if (data.features.length === 0) {
    req.flash("error", "Location not found!");
    return res.redirect("/listings/new");
  }
  const coords = data.features[0].geometry.coordinates;

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);

  newListing.category = Array.isArray(req.body.listing.category)
    ? req.body.listing.category
    : [req.body.listing.category];

  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  console.log(req.body);

  newListing.geometry = { type: "Point", coordinates: coords };

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditRoute = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  listing.category = Array.isArray(req.body.listing.category)
    ? req.body.listing.category
    : [req.body.listing.category];

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
