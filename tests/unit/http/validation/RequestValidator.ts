import { expect } from 'chai';
import * as sinon from 'sinon';
import { RequestValidator } from '../../../../src/http/validation/RequestValidator';

let sandbox: sinon.SinonSandbox;

describe('RequestValidator', () => {
    before(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        RequestValidator.setConfig({allowUnknownFields: true});
        sandbox.restore();
    });

    describe('setConfig()', () => {
        it('should not do anything if config is invalid', () => {
            RequestValidator.setConfig({});
            expect((<any> RequestValidator).allowUnknownFields).to.deep.equal({
                headers: true,
                params: true,
                query: true,
                body: true
            }, 'Config should be the default one');

            RequestValidator.setConfig(<any> {allowUnknownFields: 'foo'});
            expect((<any> RequestValidator).allowUnknownFields).to.deep.equal({
                headers: true,
                params: true,
                query: true,
                body: true
            }, 'Config should be the default one');

            RequestValidator.setConfig(<any> {allowUnknownFields: {foo: 'false'}});
            expect((<any> RequestValidator).allowUnknownFields).to.deep.equal({
                headers: true,
                params: true,
                query: true,
                body: true
            }, 'Config should be the default one');
        });

        it('should update all allowUnknownFields params if given a boulean', () => {
            RequestValidator.setConfig({allowUnknownFields: false});
            expect((<any> RequestValidator).allowUnknownFields).to.deep.equal({
                headers: false,
                params: false,
                query: false,
                body: false
            }, 'Config should have been updated');

            RequestValidator.setConfig({allowUnknownFields: true});
            expect((<any> RequestValidator).allowUnknownFields).to.deep.equal({
                headers: true,
                params: true,
                query: true,
                body: true
            }, 'Config should have been updated');
        });

        it('should only update given fields if allowUnknownFiels is a valid object', () => {
            RequestValidator.setConfig({allowUnknownFields: {
                body: false,
                query: false
            }});
            expect((<any> RequestValidator).allowUnknownFields).to.deep.equal({
                headers: true,
                params: true,
                query: false,
                body: false
            }, 'Config should have been updated');
        });
    });

    describe('validate()', () => {
        it('should not perform validation if validation params are invalid', () => {
            const cleanValidationSpy = sandbox.spy(RequestValidator, <any> 'cleanValidation');
            const cleanValidationParamSpy = sandbox.spy(RequestValidator, <any> 'cleanValidationParam');
            const validateStub = sandbox.stub(RequestValidator, <any> 'validateEntity');
            const next = sandbox.spy();
            const req: any = {};

            RequestValidator.validate(null)(req, null, next);
            expect(cleanValidationSpy.callCount).to.equal(1);
            expect(cleanValidationParamSpy.callCount).to.equal(0);
            expect(validateStub.callCount).to.equal(0);
            expect(next.callCount).to.equal(1);

            RequestValidator.validate({foo: {foo: {type: 'string'}}})(req, null, next);
            expect(cleanValidationSpy.callCount).to.equal(2);
            expect(cleanValidationParamSpy.callCount).to.equal(0);
            expect(validateStub.callCount).to.equal(0);
            expect(next.callCount).to.equal(2);

            RequestValidator.validate({query: null})(req, null, next);
            expect(cleanValidationSpy.callCount).to.equal(3);
            expect(cleanValidationParamSpy.callCount).to.equal(0);
            expect(validateStub.callCount).to.equal(0);
            expect(next.callCount).to.equal(3);

            RequestValidator.validate({query: {}})(req, null, next);
            expect(cleanValidationSpy.callCount).to.equal(4);
            expect(cleanValidationParamSpy.callCount).to.equal(0);
            expect(validateStub.callCount).to.equal(0);
            expect(next.callCount).to.equal(4);

            RequestValidator.validate(<any> {query: {foo: {type: 'bar'}}})(req, null, next);
            expect(cleanValidationSpy.callCount).to.equal(5);
            expect(cleanValidationParamSpy.callCount).to.equal(1);
            expect(validateStub.callCount).to.equal(0);
            expect(next.callCount).to.equal(5);
        });

        it('should clean validation params before trying to validate requests', () => {
            const validateStub = sandbox.stub(RequestValidator, <any> 'validateEntity').returns([]);
            const next = sandbox.spy();
            const req: any = {};

            const regex = /.*/;
            const format = (a: any) => a;
            const validate = RequestValidator.validate({
                query: {
                    name: {type: 'string', required: true},
                    age: {type: 'number', min: 18, max: 40},
                    birthYear: {type: 'string', length: 4},
                    array1: {type: 'array', arrayType: 'numeric'},
                    array2: {type: 'array', arrayType: 'number', arraySeparator: ':', values: [1, 2, 3]},
                    regex: {type: 'string', regex, format},
                    foo: <any> {type: 'foo'},
                    bar: <any> {type: 'number', foo: 'bar'}
                }
            });

            validate(req, null, next);
            expect(validateStub.callCount).to.equal(1);
            expect(validateStub.lastCall.args).to.deep.equal(['query', undefined, {
                name: {type: 'string', required: true},
                age: {type: 'number', min: 18, max: 40},
                birthYear: {type: 'string', length: 4},
                array1: {type: 'array', arrayType: 'numeric', arraySeparator: ','},
                array2: {type: 'array', arrayType: 'number', arraySeparator: ':', values: [1, 2, 3]},
                regex: {type: 'string', regex, format},
                bar: {type: 'number'}
            }], 'Params should have been cleaned');
            expect(next.callCount).to.equal(1);
        });

        it('should remove extra params in request if needed', () => {
            const next = sandbox.spy();
            const validate = RequestValidator.validate({
                query: {
                    a: {type: 'string', required: true}
                }
            });
            RequestValidator.setConfig({allowUnknownFields: false});

            const req: any = {query: {a: 'a', b: 'b'}};
            validate(req, null, next);
            expect(next.callCount).to.equal(1);
            expect(next.lastCall.args).to.deep.equal([]);
            expect(req).to.deep.equal({query: {a: 'a'}});
        });

        describe('Request validation', () => {
            it('should return errors if required fields are missing', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', required: true}
                    }
                });

                validate({}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([{
                    field: 'a',
                    location: 'query',
                    messages: ['Field required']
                }]);
            });

            it('should return errors if fields types are invalid', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', required: true},
                        b: {type: 'numeric'},
                        c: {type: 'number'},
                        d: {type: 'boolean'},
                        e: {type: 'date'},
                        f: {type: 'array'},
                        g: {type: 'object'}
                    }
                });

                validate({query: {a: 2, b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g'}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Invalid type, expecting string']
                    }, {
                        field: 'b',
                        location: 'query',
                        messages: ['Invalid type, expecting numeric']
                    }, {
                        field: 'c',
                        location: 'query',
                        messages: ['Invalid type, expecting number']
                    }, {
                        field: 'd',
                        location: 'query',
                        messages: ['Invalid type, expecting boolean']
                    }, {
                        field: 'e',
                        location: 'query',
                        messages: ['Invalid type, expecting date']
                    }, {
                        field: 'f',
                        location: 'query',
                        messages: ['Invalid type, expecting array']
                    }, {
                        field: 'g',
                        location: 'query',
                        messages: ['Invalid type, expecting object']
                    }
                ]);
            });

            it('should return errors if minimums are invalid', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', min: 2},
                        b: {type: 'number', min: 2},
                        c: {type: 'array', min: 2},
                        d: {type: 'boolean', min: 2}
                    }
                });

                validate({query: {a: 'a', b: 1, c: [], d: true}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Invalid minimum, expecting >= 2']
                    }, {
                        field: 'b',
                        location: 'query',
                        messages: ['Invalid minimum, expecting >= 2']
                    }, {
                        field: 'c',
                        location: 'query',
                        messages: ['Invalid minimum, expecting >= 2']
                    }, {
                        field: 'd',
                        location: 'query',
                        messages: ['Invalid minimum, expecting >= 2']
                    }
                ]);
            });

            it('should return errors if maximums are invalid', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', max: 1},
                        b: {type: 'number', max: 1},
                        c: {type: 'array', max: 1},
                        d: {type: 'boolean', max: 1}
                    }
                });

                validate({query: {a: 'aa', b: 2, c: ['', ''], d: true}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Invalid maximum, expecting <= 1']
                    }, {
                        field: 'b',
                        location: 'query',
                        messages: ['Invalid maximum, expecting <= 1']
                    }, {
                        field: 'c',
                        location: 'query',
                        messages: ['Invalid maximum, expecting <= 1']
                    }, {
                        field: 'd',
                        location: 'query',
                        messages: ['Invalid maximum, expecting <= 1']
                    }
                ]);
            });

            it('should return errors if lengths are invalid', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', length: 1},
                        b: {type: 'number', length: 1},
                        c: {type: 'array', length: 1},
                        d: {type: 'boolean', length: 1}
                    }
                });

                validate({query: {a: 'aa', b: 2, c: ['', ''], d: true}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Invalid length, expecting 1']
                    }, {
                        field: 'b',
                        location: 'query',
                        messages: ['Invalid length, expecting 1']
                    }, {
                        field: 'c',
                        location: 'query',
                        messages: ['Invalid length, expecting 1']
                    }, {
                        field: 'd',
                        location: 'query',
                        messages: ['Invalid length, expecting 1']
                    }
                ]);
            });

            it('should return errors if array types are invalid', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'array', arrayType: 'string'},
                        b: {type: 'array', arrayType: 'number'},
                        c: {type: 'array', arrayType: 'numeric'},
                        d: {type: 'array', arrayType: 'boolean'},
                        e: {type: 'array', arrayType: 'boolean'}
                    }
                });

                validate({query: {a: [1], b: ['b'], c: ['c'], d: [1], e: []}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Invalid array type, expecting string']
                    }, {
                        field: 'b',
                        location: 'query',
                        messages: ['Invalid array type, expecting number']
                    }, {
                        field: 'c',
                        location: 'query',
                        messages: ['Invalid array type, expecting numeric']
                    }, {
                        field: 'd',
                        location: 'query',
                        messages: ['Invalid array type, expecting boolean']
                    }
                ]);
            });

            it('should return errors if fields values are invalid', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', values: ['foo', 'bar']},
                        b: {type: 'array', values: ['foo', 'bar']},
                        c: {type: 'array', values: ['foo', 'bar']}
                    }
                });

                validate({query: {a: 'a', b: ['b'], c: ['foo']}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Invalid value, expecting one of [foo,bar]']
                    }, {
                        field: 'b',
                        location: 'query',
                        messages: ['Invalid value, expecting one of [foo,bar]']
                    }
                ]);
            });

            it('should return errors if values don\'t match regex', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', regex: /^a.*/}
                    }
                });

                validate({query: {a: 'foo'}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Value must match regex /^a.*/']
                    }
                ]);
            });

            it('should return error if "b" & "c" are required by "a" and undefined', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', requires: ['b', 'c']},
                        b: {type: 'string'},
                        c: {type: 'string'},
                    }
                });

                validate({query: {a: 'foo'}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Field requires \'b\' to be defined', 'Field requires \'c\' to be defined']
                    }
                ]);
            });

            it('should return error if "b" is required by "a" and undefined', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', requires: ['b', 'c']},
                        b: {type: 'string'},
                        c: {type: 'string'},
                    }
                });

                validate({query: {a: 'foo', b: 'bar'}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Field requires \'c\' to be defined']
                    }
                ]);
            });

            it('should return error if "a" and "b" & "a" and "c" are mutually exclusive and all are defined', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', mutuallyExcludes: ['b', 'c']},
                        b: {type: 'string'},
                        c: {type: 'string'},
                    }
                });

                validate({query: {a: 'foo', b: 'bar', c: 'zar'}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Field cannot be used with \'b\'', 'Field cannot be used with \'c\'']
                    }
                ]);
            });

            it('should return error if "a" and "b" & "a" and "c" are mutually exclusive and "b" is defined', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', mutuallyExcludes: ['b', 'c']},
                        b: {type: 'string'},
                        c: {type: 'string'},
                    }
                });

                validate({query: {a: 'foo', b: 'bar'}}, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args[0].errors).to.deep.equal([
                    {
                        field: 'a',
                        location: 'query',
                        messages: ['Field cannot be used with \'b\'']
                    }
                ]);
            });
        });

        describe('Request params formatting', () => {
            it('should transform stringified arrays to real arrays', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'array', arrayType: 'string'}
                    }
                });

                const req: any = {query: {a: 'foo,bar'}};
                validate(req, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args).to.deep.equal([]);
                expect(req.query.a).to.deep.equal(['foo', 'bar']);
            });

            it('should transform numeric values to numbers', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'numeric'},
                        b: {type: 'array', arrayType: 'numeric'}
                    }
                });

                const req: any = {query: {a: '2', b: '1,2,3'}};
                validate(req, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args).to.deep.equal([]);
                expect(req.query).to.deep.equal({
                    a: 2,
                    b: [1, 2, 3]
                });
            });

            it('should transform stringified dates to dates', () => {
                const next = sandbox.spy();
                const now = new Date();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'date'},
                        b: {type: 'date'}
                    }
                });

                const req: any = {query: {a: now, b: now.toISOString()}};
                validate(req, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args).to.deep.equal([]);
                expect(req.query).to.deep.equal({
                    a: now,
                    b: now
                });
            });

            it('should transform inputs using format() function if provided', () => {
                const next = sandbox.spy();
                const validate = RequestValidator.validate({
                    query: {
                        a: {type: 'string', format: (i: any) => i.toUpperCase()}
                    }
                });

                const req: any = {query: {a: 'foo'}};
                validate(req, null, next);
                expect(next.callCount).to.equal(1);
                expect(next.lastCall.args).to.deep.equal([]);
                expect(req.query).to.deep.equal({
                    a: 'FOO'
                });
            });
        });
    });
});
