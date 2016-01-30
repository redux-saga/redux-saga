import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Counter from '../components/Counter'
import * as CounterActions from '../actions/counter'

function mapStateToProps(state) {
  return {
    counter: state.counter,
    congratulate: state.congratulate,
    incrementAsyncPending: state.incrementAsyncPending
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    ...bindActionCreators(CounterActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Counter)
