
    import * as chai from 'chai';
    import * as bz   from '../../../../../typescript/de/mayflower/bz';

    describe( 'MathUtil', () =>
    {
        it( 'gets the sinus from 90 degrees', () =>
        {
            const result:number = bz.MathUtil.sinDegrees( 90.0 );
            chai.expect( result ).to.equal( 1.0 );
        });
    });
