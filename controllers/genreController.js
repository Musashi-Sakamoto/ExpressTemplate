var Genre = require('../models/genre');

var Book = require('../models/book');
var async = require('async');

const validator = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ genre: req.params.id })
                .exec(callback);
        },
    }, function(err, results) {
        if (err) return next(err);
        if (results.genre === null) {
            var error = new Error('Genre not found');
            error.status = 404;
            return next(error);
        }
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    })
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    validator.body('name', 'Genre name required').trim().isLength({ min: 1}),
    validator.check('name').escape(),
    (req, res, next) => {
        const errors = validator.validationResult(req);

        var genre = new Genre({
            name: req.body.name,
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Crete Genre', genre: genre, errors: errors.array()})
            return;
        } else {
            Genre.findOne({ name: req.body.name })
                .exec(function(err, found_genre) {
                    if (err) return next(err);

                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function (error) {
                            if (error) return next(error);

                            res.redirect(genre.url);
                        })
                    }
                })
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
          Book.find({ genre: req.params.id }).exec(callback);
        }
      }, function(err, results) {
        if (err) return next(err);
        if (results.genre === null) {
          res.redirect('/catalog/genres');
        }
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
      })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
          Book.find({ genre: req.body.genreid }).exec(callback);
        }
      }, function(err, results) {
        if (err) return next(err);
        if (results.genre_books.length > 0) {
          res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
          return;
        } else {
          Genre.findByIdAndRemove(req.body.genreid, function(err) {
            if (err) return next(err);
            res.redirect('/catalog/genres');
          })
        }
      })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};