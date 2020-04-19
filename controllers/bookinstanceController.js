var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');

const { check, body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function(err, list_bookinstances) {
            if (err) return next(err);

            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance){
        if (err) return next(err);
        if (bookinstance === null) {
            var error = new Error('Ebook copy not found');
            error.status = 404;
            return next(error);
        }
        res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance });
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
        .exec(function(err, books) {
            if (err) return next(err);
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({ min: 1}),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1}),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    check('book').escape(),
    check('imprint').escape(),
    check('status').trim().escape(),
    check('due_back').toDate(),
    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function(err, books) {
                    if (err) return next(err);
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
                })
            return;
        } else {
            bookinstance.save(function(err) {
                if (err) return next(err);
                res.redirect(bookinstance.url);
            })
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id).exec(function(err, book_instance) {
        if (err) return next(err);
        if (book_instance === null) {
          res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', { title: 'Delete Book instance', book_instance: book_instance });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function(err) {
        if (err) return next(err);
        res.redirect('/catalog/bookinstances');
      })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        book_instance: function(callback) {
            BookInstance.findById(req.params.id).orFail(new Error('No book instance found')).populate('book').exec(callback);
        },
        books: function(callback) {
            Book.find(callback);
        },
    }, function(err, results) {
        if (err) return next(err);

        res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: results.book_instance, book_list: results.books });
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').trim().isLength({ min: 1}),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1}),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    check('book').escape(),
    check('imprint').escape(),
    check('status').trim().escape(),
    check('due_back').toDate(),
  
    (req, res, next) => {
        const errors = validationResult(req);
  
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });
  
        if (!errors.isEmpty()) {
            res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: bookinstance, errors: errors.array()});
            return;
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance) {
                if (err) return next(err);
                res.redirect(thebookinstance.url);
            });
        }
    }
  ];