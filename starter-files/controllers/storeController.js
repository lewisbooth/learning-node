const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
};

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // Query database for list of stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
}

exports.editStore = async (req, res) => {
  // Find store given an ID
  const store = await Store.findOne({ _id: req.params.id });
  // Confirm user is the store owner

  // Render the edit form
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  // Set location data to be a point
  req.body.location.type = 'Point'

  // Find and update the store
  const store = await Store.findOneAndUpdate(
    { _id: req.params.id }, 
    req.body, {
      new: true, // return updated values
      runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}"> View Store</a>`)
    res.redirect(`/stores/${store.id}/edit`)
  // Redirect to store and tell user it worked
}