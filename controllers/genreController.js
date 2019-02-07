var Genre = require('../models/genre');
var Book = require('../models/book');

var async = require('async');

const myTools = require('../modules/myTools');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
    .exec(function(err, list_genre) {
        if (err) { return next(err); };
        list_genre = myTools.sortObjectsByValue(list_genre, 'name');
        res.render('genre_list', {title: 'Genre List', genre_list: list_genre})
    })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
            .exec(callback); //what?
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.genre == null) { // no results
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        //Successful, so render
        results.genre_books = myTools.sortObjectsByValue(results.genre_books, 'title');
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    })
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate that the name field is not empty
    body('name', 'Genre name required').isLength({min: 1}).trim(),
    // Sanitize (trim and escape) the name field
    sanitizeBody('name').trim().escape(),
    // Process request after sanitization and validation
    (req, res, next) => {
        // Extract the validation errors from the request
        const errors = validationResult(req);
        // Create a genre object with escaped and trimmed data
        var genre = new Genre(
            {name: req.body.name}
        );
        if (!errors.isEmpty()) {
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array(), book});
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({'name': req.body.name})
            .exec(function(err, found_genre) {
                if (err) {return next(err)}
                if (found_genre) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                } else {
                    genre.save(function(err) {
                        if (err) {return next(err)}
                        // Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        books: function (callback) {
            Book.find({'genre': req.params.id}).exec(callback)
        },
    }, function (err, results) {
        if (err) {return next(err)}
        if (results.genre==null) {
            res.redirect('/catalog/genres');
        }
        results.books = myTools.sortObjectsByValue(results.books, 'title');
        res.render('genre_delete', {title: 'Delete genre', genre: results.genre, books: results.books});
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        books: function (callback) {
            Book.find({'genre': req.params.id}).exec(callback)
        },
    }, function (err, results) {
        if (err) {return next(err)};

        if (results.books.length > 0) {
            for (let book of results.books) {
                let newBook = new Book({
                    title: book.title,
                    author: book.author,
                    summary: book.summary,
                    isbn: book.isbn,
                    _id: book._id,
                    genre: [],
                });
                Book.findByIdAndUpdate(newBook._id, newBook, {}, (err) => {if (err) {return next(err)}});
            }
        }
        // genre has no books. Delete object and redirect to the list of genres.
        Genre.findByIdAndRemove(req.body.genreid, function (err) {
            if (err) {return next(err)};
            res.redirect('/catalog/genres');
        })
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(function (err, genre) {
        if (err) {return next(err)};

        if (genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        let genre_ = {
            name: genre.name.toString(),
        };
        res.render('genre_form', {title: 'Update Genre', genre: genre_});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate fields.
    body('name', 'Genre name must be specified.').isLength({min: 1}).trim(),

    // Sanitize fields.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('genre_form', {title: 'Update Genre', genre: req.body, errors: errors.array()});
            return;
        } else {
            // Data from form is valid

            // Create a genre object with escaped and trimmed Data
            var genre = new Genre({
                name: req.body.name,
                _id: req.params.id,
            });
            Genre.findByIdAndUpdate(genre._id, genre, {}, function (err, thegenre) {
                if (err) {return next(err)}
                res.redirect(thegenre.url);
            })
        }
    },
];