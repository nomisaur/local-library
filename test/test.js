it('should always pass', () => {

})

it.skip('should always fail', done => {
    done(new Error('get got'))
})
