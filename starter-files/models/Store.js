const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
 // Always show virtual fields when data is requested from the model
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define indexes (faster searching!)
storeSchema.index({
  name: 'text', 
  description: 'text'
});

storeSchema.index({
  location: '2dsphere'
})

// Create a slug for the store, adding an index at the end if multiple stores are found with the same name
storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)`, 'i')
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`
  }

  next();
});

// Get ordered list of most common store tags
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: {_id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // Lookup stores and populate their reviews
    { $lookup: {
        from: 'reviews', 
        localField: '_id',
        foreignField: 'store',
        as: 'reviews'
    }},
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    //find the average reviews
    { $addFields: {
        averageRating: { $avg: '$reviews.rating' }
    }},
    // sort by highest reviews first
    { $sort: { averageRating: -1 }},
    // limit to 10
    { $limit: 10 }
  ]);
};
 
// Find stores where the store ID = review's store ID, like a JOIN
storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // Which field on the Store schema
  foreignField: 'store' // Which field on the Review
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);