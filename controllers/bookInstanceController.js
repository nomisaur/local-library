var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

const moment = require('moment');
const async = require('async');
const myTools = require('../modules/myTools');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
        if (err) { return next(err); } // Does this end the function early? Is the err passed to the error handler in app.js?

        list_bookinstances = myTools.sortObjectsByValue(list_bookinstances, 'book.title');

        // Successful, so render
        res.render('bookinstance_list', {title: 'Book Instance List,', bookinstance_list: list_bookinstances });
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
        if (err) { return next(err); }
        if (bookinstance==null) { // No results.
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_detail', {title: 'Book:', bookinstance: bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec(function (err, books) {
        if (err) {return next(err)}
        let status_values = BookInstance.schema.path('status').enumValues;
        books = myTools.sortObjectsByValue(books, 'title');
        res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books, status_values: status_values});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
            .exec(function (err, books) {
                if (err) {return next(err)};
                let status_values = BookInstance.schema.path('status').enumValues;
                books = myTools.sortObjectsByValue(books, 'title');
                res.render('bookinstance_form', {
                    title: 'Create Book Instance',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                    status_values: status_values,
                });
            });
            return;
        } else {
            bookinstance.save(function (err) {
                if (err) {return next(err)};
                res.redirect(bookinstance.url);
            })
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id).populate('book').exec(function (err, bookinstance) {
        if (err) {return next(err)};
        if (bookinstance==null) {
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', {title: 'Delete Book Instance', bookinstance: bookinstance})
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function (err) {
        if (err) {return next(err)};
        res.redirect('/catalog/bookinstances');
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        book_list: function(callback) {
            Book.find({}, 'title').exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err)};

        if (results.bookinstance == null) {
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        let book_instance = {
            book: results.bookinstance.book,
            imprint: results.bookinstance.imprint,
            status: results.bookinstance.status,
            due_back: moment(results.bookinstance.due_back).format('YYYY-MM-DD'),
            _id: results.bookinstance._id,
        };
        results.book_list = myTools.sortObjectsByValue(results.book_list, 'title');
        res.render('bookinstance_form', {
            title: 'Update Book Instance',
            bookinstance: book_instance,
            book_list: results.book_list,
            selected_book: book_instance.book._id,
            status_values: BookInstance.schema.path('status').enumValues,
        });
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
            .exec(function (err, books) {
                if (err) {return next(err)};
                let status_values = BookInstance.schema.path('status').enumValues;
                books = myTools.sortObjectsByValue(books, 'title')
                res.render('bookinstance_form', {
                    title: 'Create Book Instance',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                    status_values: status_values,
                });
            });
            return;
        } else {
            BookInstance.findByIdAndUpdate(bookinstance._id, bookinstance, {}, function (err, thebookinstance) {
                if (err) {return next(err)}
                res.redirect(thebookinstance.url);
            })
        }
    }
]
