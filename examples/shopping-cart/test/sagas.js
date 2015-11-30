import test from 'tape';

import sagaFactory from '../src/sagas'
import * as types from '../src/constants/ActionTypes'
import * as actions from '../src/actions'
import * as effects from '../src/constants/ServiceTypes'

const products = [1], cart = [1] // dummy values
const state = { products, cart }
const getState = () => state


test('getProducts Saga test', function (t) {
  
});

test('checkout Saga test', function (t) {

});
