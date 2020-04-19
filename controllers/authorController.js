var Author = require('../models/author');

var async = require('async');
var Book = require('../models/book');

const { body, check, validationResult} = require('express-validator');

exports.author_list = function(req, res, next) {
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function(err, list_authors) {
      if (err) return next(err);

      res.render('author_list', {title: 'Author List', author_list: list_authors });
    })
}

exports.author_detail = function(req, res, next) {
  async.parallel({
    author: function(callback) {
      Author.findById(req.params.id)
        .exec(callback);
    },
    authors_books: function(callback) {
      Book.find({author: req.params.id }, 'title summary')
        .exec(callback);
    },
  }, function(err, results) {
    if (err) return next(err);
    if (results.author === null) {
      var error = new Error('Author not found');
      error.status = 404;
      return next(error);
    }
    res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });
  })
}

exports.author_create_get = function(req, res) {
  res.render('author_form', { title: 'Create Author'});
};

exports.author_create_post = [
  body('first_name')
  .isLength({ min: 1}).trim().withMessage('First name must be specified.')
  .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
  .isLength({ min: 1}).trim().withMessage('Family name must be specified')
  .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true}).isISO8601(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true}).isISO8601(),
  check('first_name').escape(),
  check('family_name').escape(),
  check('date_of_birth').toDate(),
  check('date_of_death').toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array()});
      return;
    } else {
      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
      });
      author.save(function(error) {
        if (error) return next(error);

        res.redirect(author.url);
      })
    }
  }
]

exports.author_delete_get = function(req, res, next) {
  async.parallel({
    author: function(callback) {
      Author.findById(req.params.id).exec(callback);
    },
    authors_books: function(callback) {
      Book.find({ author: req.params.id }).exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.author === null) {
      res.redirect('/catalog/authors');
    }
    res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books });
  })
};

exports.author_delete_post = function(req, res, next) {
  async.parallel({
    author: function(callback) {
      Author.findById(req.body.authorid).exec(callback);
    },
    authors_books: function(callback) {
      Book.find({ author: req.body.authorid }).exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.authors_books.length > 0) {
      res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books});
      return;
    } else {
      Author.findByIdAndRemove(req.body.authorid, function(err) {
        if (err) return next(err);
        res.redirect('/catalog/authors');
      })
    }
  })
};

exports.author_update_get = function(req, res, next) {
  Author.findById(req.params.id).orFail(new Error('No author found')).exec(function(err, author) {
    if (err) return next(err);
    res.render('author_form', { title: 'Update Author', author: author});
  });
};

exports.author_update_post = [
  body('first_name')
  .isLength({ min: 1}).trim().withMessage('First name must be specified.')
  .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
  .isLength({ min: 1}).trim().withMessage('Family name must be specified')
  .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true}).isISO8601(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true}).isISO8601(),
  check('first_name').escape(),
  check('family_name').escape(),
  check('date_of_birth').toDate(),
  check('date_of_death').toDate(),

  (req, res, next) => {
      const errors = validationResult(req);

      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id
      });

      if (!errors.isEmpty()) {
          res.render('author_form', { title: 'Update Author', author: author, errors: errors.array()});
          return;
      } else {
          Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor) {
              if (err) return next(err);
              res.redirect(theauthor.url);
          });
      }
  }
];