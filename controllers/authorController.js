var Author = require('../models/author');
var Book = require('../models/book');
const BookInstance = require('../models/bookinstance');

var async = require('async');
var moment = require('moment');

const myTools = require('../modules/myTools');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

// Display list of all authors
exports.author_list = function(req, res, next) {
    Author.find()
    .exec(function(err, list_authors) {
        if (err) { return next(err) };
        list_authors = myTools.sortObjectsByValue(list_authors, 'family_name');
        //Successful, so render
        res.render('author_list', {title: 'Author List', author_list: list_authors});
    });
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
            .exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
            .exec(callback)
        }
    }, function (err, results) {
        if (err) { return next(err); };
        if (results.author==null) {
            var err = new Error('Author not found');
            err.status = 404
            return next(err);
        };
        results.authors_books = myTools.sortObjectsByValue(results.authors_books, 'title');
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books});
    });
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', {title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [

    // Validate fields.
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth.').optional({checkFalsy: true}).isISO8601(),
    body('date_of_death', 'Invalid date of death.').optional({checkFalsy: true}).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            console.log(req.body);
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()});
            return;
        } else {
            // Data from form is valid

            // Create an author object with escaped and trimmed Data
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
            });
            author.save(function (err) {
                if (err) {return next(err)}
                // Successful - redirect to new author record.
                res.redirect(author.url);
            })
        }
    },
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function (callback) {
            Book.find ({'author': req.params.id}).exec(callback)
        },
    }, function (err, results) {
        if (err) {return next(err)}
        if (results.author==null) {
            res.redirect('/catalog/authors');
        }
        results.authors_books = myTools.sortObjectsByValue(results.authors_books, 'title');
        res.render('author_delete', {title: 'Delete author', author: results.author, author_books: results.authors_books});
    })
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function (callback) {
            Book.find({'author': req.body.authorid}).exec(callback)
        },
    }, function (err, results) {
        if (err) {return next(err)};

        if (results.authors_books.length > 0) {
            for (book of results.authors_books) {
                BookInstance.find({'book': book._id}).exec((err, instances) => {
                    for (instance of instances) {
                        BookInstance.findByIdAndRemove(instance._id, (err) => {
                            if (err) {return next(err)};
                        });
                    }
                });
                Book.findByIdAndRemove(book._id, (err) => {
                    if (err) {return next(err)};
                });
            }
        }
        Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
            if (err) {return next(err)};
            res.redirect('/catalog/authors');
        })
        console.log('removing author ' + req.body.authorid)
    })
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    Author.findById(req.params.id).exec(function (err, author) {
        if (err) {return next(err)};

        if (author == null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        let author_ = {
            first_name: author.first_name.toString(),
            family_name: author.family_name.toString(),
            date_of_birth: author.date_of_birth ? moment(author.date_of_birth).format('YYYY-MM-DD') : '',
            date_of_death: author.date_of_death ? moment(author.date_of_death).format('YYYY-MM-DD') : '',
        };
        res.render('author_form', {title: 'Update Author', author: author_});
    });
};

// Handle Author update on POST.
exports.author_update_post = [
    // Validate fields.
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth.').optional({checkFalsy: true}).isISO8601(),
    body('date_of_death', 'Invalid date of death.').optional({checkFalsy: true}).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            console.log(req.body);
            res.render('author_form', {title: 'Update Author', author: req.body, errors: errors.array()});
            return;
        } else {
            // Data from form is valid

            // Create an author object with escaped and trimmed Data
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id,
            });
            Author.findByIdAndUpdate(author._id, author, {}, function (err, theauthor) {
                if (err) {return next(err)}
                res.redirect(theauthor.url);
            })
        }
    },
];
