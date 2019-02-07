var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

AuthorSchema
.virtual('name')
.get(function () {
    return this.family_name + ', ' + this.first_name;
});

AuthorSchema
.virtual('lifespan')
.get(function () {
    let dob = this.date_of_birth
    let dod = this.date_of_death
    if (dob) {
        let dob_f = moment(dob).format('MMMM Do, YYYY');
        return dod ?
            dob_f + ' - ' + moment(dod).format('MMMM Do, YYYY')
        :
            dob_f + ' - Present';
    } else {
        return 'Unknown'
    }
});

AuthorSchema
.virtual('date_of_birth_formatted')
.get(function () {
    return this.date_of_birth ?
        moment(this.date_of_birth).format(' M/D/Y') : '';
});

AuthorSchema
.virtual('date_of_death_formatted')
.get(function () {
    return this.date_of_death ?
        moment(this.date_of_death).format('M/D/Y ') : '';
});

AuthorSchema
.virtual('url')
.get(function () {
    return '/catalog/author/' + this._id;
});

// export model
module.exports = mongoose.model('Author', AuthorSchema);
